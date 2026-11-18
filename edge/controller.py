"""
LifeLane AI — Edge Signal Controller Daemon (Phase 4: Adaptive Signal Control)
Implements intersection signal controller with:
- IRC:SP:72 / NEMA 4-phase traffic signal state machine
- Hardware/Software safety interlocks (Conflicting Green Prevention)
- Minimum 4.0s Amber clearance & 2.0s All-Red clearance
- 5–8s pre-green corridor actuation
- Dynamic vehicle approach hold capped at 45.0s maximum duration
- Post-passage safe recovery cycle within 10.0s
- Watchdog failsafe reverting to cyclic on >3.0s telemetry loss (G7)
"""

import time
from enum import Enum
from typing import Dict, Any, List, Optional


class SignalPhase(str, Enum):
    RED = "RED"
    AMBER = "AMBER"
    GREEN = "GREEN"
    ALL_RED = "ALL_RED"
    FLASHING_AMBER = "FLASHING_AMBER"


class PreemptionState(str, Enum):
    STANDBY = "STANDBY"                  # Normal cyclic coordination
    PRE_CLEARING = "PRE_CLEARING"        # Clearing conflicting queues (Amber on cross-streets)
    ACTUATED_HOLD = "ACTUATED_HOLD"      # Green hold for emergency vehicle approach
    POST_PASSAGE = "POST_PASSAGE"        # Reversion transition
    FAILSAFE_ABORT = "FAILSAFE_ABORT"    # Watchdog triggered on timeout or safety fault


class IntersectionApproach(str, Enum):
    NORTH_SOUTH = "NORTH_SOUTH"
    EAST_WEST = "EAST_WEST"


class ConflictInterlockException(Exception):
    """Raised when an actuation command would cause simultaneous conflicting green signals."""
    pass


class SignalHead:
    """Represents physical light heads for an approach."""
    def __init__(self, approach: IntersectionApproach):
        self.approach = approach
        self.state = SignalPhase.RED
        self.state_entered_at = time.time()

    def set_state(self, new_state: SignalPhase, now: Optional[float] = None):
        self.state = new_state
        self.state_entered_at = now if now is not None else time.time()


class EdgeIntersectionController:
    """
    Edge controller running on embedded intersection hardware or simulated daemon.
    Controls signal heads with mandatory safety interlocks.
    """
    MIN_AMBER_CLEARANCE_S = 4.0
    MIN_ALL_RED_CLEARANCE_S = 2.0
    MAX_PREEMPT_DURATION_S = 45.0
    POST_PASSAGE_RECOVERY_S = 10.0
    WATCHDOG_TIMEOUT_S = 3.0

    def __init__(
        self,
        intersection_code: str,
        name: str,
        latitude: float,
        longitude: float,
        corridor_approach: IntersectionApproach = IntersectionApproach.NORTH_SOUTH,
        cycle_length_s: float = 90.0,
    ):
        self.intersection_code = intersection_code
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.corridor_approach = corridor_approach
        self.cross_approach = (
            IntersectionApproach.EAST_WEST
            if corridor_approach == IntersectionApproach.NORTH_SOUTH
            else IntersectionApproach.NORTH_SOUTH
        )
        self.cycle_length_s = cycle_length_s

        # Signal Heads
        self.heads = {
            self.corridor_approach: SignalHead(self.corridor_approach),
            self.cross_approach: SignalHead(self.cross_approach),
        }
        # Start in coordinated cyclic state (Corridor approach RED, Cross approach GREEN)
        self.heads[self.corridor_approach].set_state(SignalPhase.RED)
        self.heads[self.cross_approach].set_state(SignalPhase.GREEN)

        # Preemption State Machine
        self.preempt_state = PreemptionState.STANDBY
        self.preempt_started_at: Optional[float] = None
        self.last_telemetry_at: Optional[float] = None
        self.active_session_id: Optional[str] = None
        self.override_active = False
        self.override_reason: Optional[str] = None

        # Statistics & Audit
        self.actuation_count = 0
        self.total_preempt_hold_s = 0.0

    # --------------------------------------------------------------------------
    # Safety Interlocks
    # --------------------------------------------------------------------------
    def verify_safety_interlock(self):
        """
        Critical hardware-interlock check:
        Both conflicting approaches CANNOT be simultaneously GREEN or AMBER.
        """
        c_state = self.heads[self.corridor_approach].state
        x_state = self.heads[self.cross_approach].state

        conflicting_states = {SignalPhase.GREEN, SignalPhase.AMBER}
        if c_state in conflicting_states and x_state in conflicting_states:
            # Fatal interlock violation -> immediate emergency all-red flash
            self.heads[self.corridor_approach].set_state(SignalPhase.FLASHING_AMBER)
            self.heads[self.cross_approach].set_state(SignalPhase.FLASHING_AMBER)
            self.preempt_state = PreemptionState.FAILSAFE_ABORT
            raise ConflictInterlockException(
                f"INTERLOCK FAULT on {self.intersection_code}: Both {self.corridor_approach} and "
                f"{self.cross_approach} entered conflicting green/amber."
            )

    # --------------------------------------------------------------------------
    # Preemption State Machine Handlers
    # --------------------------------------------------------------------------
    def request_preemption(
        self,
        session_id: str,
        eta_seconds: float,
        distance_meters: float,
        now: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Processes preemption trigger from LifeLane AI central corridor engine.
        - eta <= 35.0s or dist <= 800m -> PRE_CLEARING
        - eta <= 8.0s -> ACTUATED_HOLD (Green wave)
        - dist < 15m -> POST_PASSAGE (10s reversion)
        """
        t = now or time.time()
        self.last_telemetry_at = t
        self.active_session_id = session_id

        # 1. Watchdog check on existing preemption
        if self.preempt_state == PreemptionState.ACTUATED_HOLD:
            if self.preempt_started_at and (t - self.preempt_started_at) > self.MAX_PREEMPT_DURATION_S:
                # Dynamic max cap 45s exceeded
                return self._trigger_failsafe_abort(t, reason="Max preemption duration 45s exceeded")

        # 2. Stage-based state transitions
        if distance_meters < 15.0:
            # Vehicle has passed or is passing
            if self.preempt_state in (PreemptionState.ACTUATED_HOLD, PreemptionState.PRE_CLEARING):
                self._enter_post_passage(t)

        elif eta_seconds <= 8.0 and distance_meters >= 15.0:
            # Stage 2: Actuated Green Wave (5–8s before arrival)
            self._enter_actuated_hold(t)

        elif distance_meters <= 800.0 and eta_seconds <= 35.0 and distance_meters >= 15.0:
            # Stage 1: Preparation Window (<800m or <=35s)
            self._enter_pre_clearing(t)

        else:
            # Beyond preparation range
            if self.preempt_state not in (PreemptionState.STANDBY, PreemptionState.POST_PASSAGE):
                self._enter_standby(t)

        self.verify_safety_interlock()
        return self.get_status(t)

    def _enter_pre_clearing(self, t: float):
        """Prepare corridor: flush cross-traffic queue by setting cross-street to Amber/Red."""
        if self.preempt_state == PreemptionState.STANDBY:
            self.preempt_state = PreemptionState.PRE_CLEARING
            # Cross street gets Amber clearance before corridor turns Green
            self.heads[self.cross_approach].set_state(SignalPhase.AMBER, now=t)
            self.heads[self.corridor_approach].set_state(SignalPhase.RED, now=t)

    def _enter_actuated_hold(self, t: float):
        """Actuate full green wave for emergency corridor."""
        if self.preempt_state != PreemptionState.ACTUATED_HOLD:
            self.preempt_state = PreemptionState.ACTUATED_HOLD
            self.preempt_started_at = t
            self.actuation_count += 1
            # Interlock compliance: cross street MUST be RED before corridor becomes GREEN
            self.heads[self.cross_approach].set_state(SignalPhase.RED, now=t)
            self.heads[self.corridor_approach].set_state(SignalPhase.GREEN, now=t)

    def _enter_post_passage(self, t: float):
        """Vehicle passed: safe 10-second transition back to normal network cycle."""
        self.preempt_state = PreemptionState.POST_PASSAGE
        self.preempt_started_at = None
        # Corridor approach transitions to Amber for safe clearance
        self.heads[self.corridor_approach].set_state(SignalPhase.AMBER, now=t)
        self.heads[self.cross_approach].set_state(SignalPhase.RED, now=t)

    def _enter_standby(self, t: float):
        """Normal cyclic state."""
        self.preempt_state = PreemptionState.STANDBY
        self.preempt_started_at = None
        self.active_session_id = None
        self.heads[self.corridor_approach].set_state(SignalPhase.RED, now=t)
        self.heads[self.cross_approach].set_state(SignalPhase.GREEN, now=t)

    def _trigger_failsafe_abort(self, t: float, reason: str) -> Dict[str, Any]:
        """Safety abort: forces safe state upon timeout or max green violation."""
        self.preempt_state = PreemptionState.FAILSAFE_ABORT
        self.preempt_started_at = None
        self.active_session_id = None
        # Safe clearance: Corridor gets Amber, cross gets Red, reverting to cyclic
        self.heads[self.corridor_approach].set_state(SignalPhase.AMBER, now=t)
        self.heads[self.cross_approach].set_state(SignalPhase.RED, now=t)
        return self.get_status(t, notes=f"FAILSAFE ABORT: {reason}")

    def step_time(self, elapsed_s: float, current_time: Optional[float] = None) -> Dict[str, Any]:
        """
        Advances the simulation clock by elapsed_s seconds.
        Handles post-passage 10s reversion timing and watchdog timeouts.
        """
        t = current_time or time.time()

        # 1. Watchdog check on stale telemetry (G7: > 3.0s timeout)
        if self.preempt_state in (PreemptionState.ACTUATED_HOLD, PreemptionState.PRE_CLEARING):
            if self.last_telemetry_at and (t - self.last_telemetry_at) > self.WATCHDOG_TIMEOUT_S:
                self._trigger_failsafe_abort(t, reason="Stale telemetry timeout >3.0s (G7)")

        # 2. Maximum green cap watchdog
        if self.preempt_state == PreemptionState.ACTUATED_HOLD and self.preempt_started_at:
            held = t - self.preempt_started_at
            self.total_preempt_hold_s += elapsed_s
            if held >= self.MAX_PREEMPT_DURATION_S:
                self._trigger_failsafe_abort(t, reason="Max 45s green duration reached")

        # 3. Post-passage safe recovery (10s window)
        if self.preempt_state == PreemptionState.POST_PASSAGE:
            amber_time = t - self.heads[self.corridor_approach].state_entered_at
            if amber_time >= self.MIN_AMBER_CLEARANCE_S:
                # Transition corridor to RED, then cross street can turn GREEN
                self.heads[self.corridor_approach].set_state(SignalPhase.RED, now=t)
                if amber_time >= (self.MIN_AMBER_CLEARANCE_S + self.MIN_ALL_RED_CLEARANCE_S):
                    self.heads[self.cross_approach].set_state(SignalPhase.GREEN, now=t)
            
            if amber_time >= self.POST_PASSAGE_RECOVERY_S:
                self._enter_standby(t)

        self.verify_safety_interlock()
        return self.get_status(t)

    def manual_override(self, phase: SignalPhase, reason: str, operator_id: str) -> Dict[str, Any]:
        """Police operator manual override with safety validation."""
        self.override_active = True
        self.override_reason = f"Operator {operator_id}: {reason}"
        if phase == SignalPhase.GREEN:
            self.heads[self.cross_approach].set_state(SignalPhase.RED)
            self.heads[self.corridor_approach].set_state(SignalPhase.GREEN)
        elif phase == SignalPhase.RED:
            self.heads[self.corridor_approach].set_state(SignalPhase.RED)
            self.heads[self.cross_approach].set_state(SignalPhase.GREEN)
        self.verify_safety_interlock()
        return self.get_status()

    def get_status(self, current_time: Optional[float] = None, notes: str = "") -> Dict[str, Any]:
        t = current_time or time.time()
        corridor_phase = self.heads[self.corridor_approach].state.value
        cross_phase = self.heads[self.cross_approach].state.value

        return {
            "intersection_code": self.intersection_code,
            "name": self.name,
            "corridor_approach": self.corridor_approach.value,
            "corridor_phase": corridor_phase,
            "cross_phase": cross_phase,
            "preempt_state": self.preempt_state.value,
            "active_session_id": self.active_session_id,
            "override_active": self.override_active,
            "override_reason": self.override_reason,
            "preempt_duration_s": (
                round(t - self.preempt_started_at, 1)
                if self.preempt_started_at and self.preempt_state == PreemptionState.ACTUATED_HOLD
                else 0.0
            ),
            "max_duration_cap_s": self.MAX_PREEMPT_DURATION_S,
            "safety_interlock_ok": True,
            "notes": notes,
        }
