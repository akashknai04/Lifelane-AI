import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Quote, ExternalLink, Award } from 'lucide-react';

const PAPERS = [
  {
    index: "01",
    field: "Traffic Flow Forecasting",
    title: "Graph Convolution Networks Based on Adaptive Spatiotemporal Attention for Traffic Flow Forecasting",
    authors: "Xiao, H., Zou, B., & Xiao, J. (2025)",
    journal: "Scientific Reports, 15, 8935",
    doi: "https://doi.org/10.1038/s41598-025-88706-w",
    method: "Combines SARIMA seasonal preprocessing, adaptive spatiotemporal attention matrices, and Chebyshev spectral graph convolutions (Adaptive GCN) with LSTM to predict traffic flow from road network topology rather than historical curves alone.",
    keyResult: "Achieved lowest MAE and RMSE across 7 baseline methods on PeMS California corridors, while maintaining the second-fewest parameters among GCN architectures."
  },
  {
    index: "02",
    field: "Emergency Vehicle Vision Perception",
    title: "A Cloud-Based Ambulance Detection System Using YOLOv8 for Minimizing Ambulance Response Time",
    authors: "Noor, A., Algrafi, Z., Alharbi, B., Noor, T. H., Alsaeedi, A., Alluhaibi, R., & Alwateer, M. (2024)",
    journal: "Applied Sciences (MDPI), 14(6), 2555",
    doi: "https://doi.org/10.3390/app14062555",
    method: "Evaluated a lightweight single-stage YOLO detector on an original, curated 3,000-image emergency vehicle dataset spanning 10 countries (Saudi Arabia, Japan, UK, Germany, Spain, etc.) integrated into a 4-layer cloud signal preemption pipeline.",
    keyResult: "Demonstrated 98.2% accuracy and 95.8% recall on universal ambulance recognition with an estimated ~310 ms end-to-end edge-to-cloud detection latency."
  },
  {
    index: "03",
    field: "Dynamic Path Planning & Background Evacuation",
    title: "Dynamic Emergency Vehicle Path Planning and Traffic Evacuation Based on Salp Swarm Algorithm",
    authors: "Duan, X. H., Wu, J. X., & Xiong, Y. L. (2022)",
    journal: "Journal of Advanced Transportation, 2022, Article 7862746",
    doi: "https://doi.org/10.1155/2022/7862746",
    method: "Formulated a two-stage optimization architecture using Hybrid Salp Swarm Algorithm (HSSA) with Dijkstra for alternative emergency shortest paths, paired with Improved SSA (ISSA) to evacuate background traffic under strict Traffic Congestion Index (TCI) constraints.",
    keyResult: "Delivered a 24.22% average reduction in emergency travel time across a 47-node urban network with zero perceptible degradation to adjacent civilian corridors."
  }
];

export default function ResearchSlider() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const paper = PAPERS[currentIdx];

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? PAPERS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev === PAPERS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="research" style={{ padding: '96px 0', backgroundColor: '#f8f8f8', borderBottom: '1px solid #e0e1e0' }}>
      <div className="container-custom">
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="pill-badge" style={{ marginBottom: '12px' }}>
              <BookOpen size={13} color="#f36e20" />
              <span>Peer-Reviewed Literature Survey</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#3a3b3a' }}>
              Research Foundation
            </h2>
            <p style={{ fontSize: '18px', color: '#626462', maxWidth: '640px', marginTop: '8px' }}>
              LifeLane AI is built on published, peer-reviewed foundations in intelligent transportation systems, vehicle perception, and swarm optimization.
            </p>
          </div>

          {/* Slider Controls with 01/03 Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={handlePrev}
              aria-label="Previous Research Paper"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '1px solid #e0e1e0',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3a3b3a',
                transition: 'all 0.2s'
              }}
            >
              <ChevronLeft size={22} />
            </button>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#f36e20', letterSpacing: '0.04em' }}>
              {paper.index} / 03
            </span>
            <button 
              onClick={handleNext}
              aria-label="Next Research Paper"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '1px solid #e0e1e0',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3a3b3a',
                transition: 'all 0.2s'
              }}
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Paper Slide Card */}
        <div className="card-base" style={{
          backgroundColor: '#ffffff',
          borderRadius: '32px',
          padding: '48px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <span className="pill-badge" style={{ fontSize: '12px' }}>
              {paper.field}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} /> Peer-Reviewed Citation
            </span>
          </div>

          <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#3a3b3a', lineHeight: 1.3, marginBottom: '12px' }}>
            "{paper.title}"
          </h3>

          <div style={{ fontSize: '15px', fontWeight: '700', color: '#f36e20', marginBottom: '24px' }}>
            {paper.authors} — <span style={{ color: '#626462', fontWeight: '600' }}>{paper.journal}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            backgroundColor: '#f8f8f8',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '28px'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#626462', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Core Scientific Contribution
              </div>
              <p style={{ fontSize: '15px', color: '#3a3b3a', lineHeight: 1.6 }}>
                {paper.method}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#626462', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Validated Empirical Result
              </div>
              <p style={{ fontSize: '15px', color: '#3a3b3a', lineHeight: 1.6 }}>
                {paper.keyResult}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <a 
              href={paper.doi} 
              target="_blank" 
              rel="noreferrer"
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#f36e20',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Read Original Journal Paper</span>
              <ExternalLink size={14} />
            </a>

            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Reviewed in Student Literature Survey (docs/source/student_report.pdf)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
