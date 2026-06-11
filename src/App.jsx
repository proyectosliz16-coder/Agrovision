import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './App.css';

// SVG Icons for the Navbar ONLY (keeping the navbar professional)
const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IconLeaf = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>;
const IconDownload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconCloseCircle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
const IconImageIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
export default function App() {
  const [started, setStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzedImage, setAnalyzedImage] = useState(null);
  const [originalImageCropped, setOriginalImageCropped] = useState(null);
  const [stats, setStats] = useState({ planta: 0, maleza: 0, suelo: 0 });
  const [metadata, setMetadata] = useState(null);
  const [reportImageBlob, setReportImageBlob] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [pinAuthorized, setPinAuthorized] = useState(false);
  const mockupPin = "AGRI-742X";
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [sensibilidadMaleza, setSensibilidadMaleza] = useState(50);
  const [contrasteSuelo, setContrasteSuelo] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStart = () => {
    setStarted(true);
  };

  const handleResetDashboard = () => {
    setCurrentView('dashboard');
    setHasFile(false);
    setUploadedFile(null);
    setPreviewUrl(null);
    setAnalyzedImage(null);
    setOriginalImageCropped(null);
    setStats({ planta: 0, maleza: 0, suelo: 0 });
    setMetadata(null);
    setShowResults(false);
    setIsProcessing(false);
    setShowModal(false);
    setCrop(null);
    setCompletedCrop(null);
    setSensibilidadMaleza(50);
    setContrasteSuelo(50);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setHasFile(true);
      setSensibilidadMaleza(50);
      setContrasteSuelo(50);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/preview', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          setPreviewUrl(data.image);
          const initialCrop = { unit: '%', width: 90, height: 90, x: 5, y: 5 };
          setCrop(initialCrop);
          setCompletedCrop(initialCrop);
        } else {
          setPreviewUrl(URL.createObjectURL(file));
        }
      } catch (err) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleUploadClick = () => {
    document.getElementById('fileUploadInput').click();
  };

  const handleProcess = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('sensibilidad_maleza', sensibilidadMaleza);
    formData.append('contraste_suelo', contrasteSuelo);

    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      formData.append('crop_x_pct', completedCrop.x);
      formData.append('crop_y_pct', completedCrop.y);
      formData.append('crop_w_pct', completedCrop.width);
      formData.append('crop_h_pct', completedCrop.height);
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setAnalyzedImage(data.image);
        if (data.original_image) setOriginalImageCropped(data.original_image);
        setStats(data.stats);
        if (data.metadata) setMetadata(data.metadata);
        setShowResults(true);
      } else {
        alert("Error de la IA: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo conectar con el motor de IA local.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (showResults && hasFile) {
      const timer = setTimeout(() => {
        handleProcess();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sensibilidadMaleza, contrasteSuelo]);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Pequeña pausa para asegurar que el DOM está listo
      await new Promise(resolve => setTimeout(resolve, 300));

      for (let i = 1; i <= 3; i++) {
        const element = document.getElementById(`pdf-page-${i}`);
        if (!element) continue;

        // Temporarily make it visible for html2canvas to work perfectly
        const origTransform = element.style.transform;
        element.style.transform = 'none';

        const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        if (i > 1) pdf.addPage();

        // Calculate proportional height
        const imgProps = pdf.getImageProperties(imgData);
        const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);

        // Restore style
        element.style.transform = origTransform;
      }

      pdf.save("Reporte_Agrovision_Pro.pdf");
      setIsGenerating(false);
      setShowModal(true);
    } catch (err) {
      console.error("Error generando PDF: ", err);
      setIsGenerating(false);
      alert("Ocurrió un error al generar el PDF de alta resolución.");
    }
  };

  if (!started) {
    return (
      <div className="landing-container">
        <div className="landing-overlay"></div>
        <div className="landing-content">
          <img src="/logo.png" alt="MJ Logo" style={{ width: '450px', transform: 'scale(1.4)', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))', marginBottom: '10px' }} />
          <h1 className="landing-title title-font" style={{ marginTop: '20px', marginBottom: '20px', fontSize: '4.5rem', whiteSpace: 'nowrap' }}>MJ AGROVISION</h1>
          <p className="landing-subtitle">
            Plataforma para la identificación precisa del estado de cultivos: planta, maleza y exposición del suelo.
          </p>
          <button
            className="btn-landing"
            onClick={handleStart}
          >
            Comenzar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrap">
      {/* PROFESSIONAL NAVBAR (Kept exactly as requested) */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => { setStarted(false); handleResetDashboard(); }} style={{ padding: '0', overflow: 'visible' }}>
          <img src="/logo.png" alt="MJ" style={{ height: '60px', transform: 'scale(2.2)', transformOrigin: 'left center' }} />
          <span style={{ marginLeft: '50px', fontWeight: '800', letterSpacing: '1.5px', color: '#ffffff', whiteSpace: 'nowrap' }}>MJ AGROVISION</span>
        </div>
        <div className="nav-links">
          <a href="#" className={`nav-link ${currentView === 'dashboard' ? 'active-link' : ''}`} onClick={(e) => { e.preventDefault(); handleResetDashboard(); }}><IconHome /> DASHBOARD</a>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowHelpModal(true); }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#0cd359', color: '#1e293b', fontWeight: 'bold', fontSize: '1rem', marginRight: '-4px' }}>?</span> AYUDA</a>
        </div>
      </nav>

      {currentView === 'dashboard' && (
        <div className="dashboard-container">
          {/* BIG STEPPER UI - Restored to warm rounded version */}
          <div className="stepper-container">
            <div className="step-item active">
              <div className="step-circle">1</div>
              <span>Subir Captura</span>
            </div>

            <div className={`step-line ${hasFile ? 'active' : ''}`}></div>

            <div className={`step-item ${hasFile ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <span>Motor IA</span>
            </div>

            <div className={`step-line ${showResults ? 'active' : ''}`}></div>

            <div className={`step-item ${showResults ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span>Reporte</span>
            </div>
          </div>

          <div className="grid-layout">

            {/* Paso 1: Subida */}
            <div className="card">
              <h2 className="card-title title-font" style={hasFile ? { color: '#8d4925', marginBottom: '15px' } : {}}>Origen de Datos</h2>

              <input type="file" id="fileUploadInput" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              {hasFile ? (
                <>
                  <div className="image-wrapper" style={{ border: 'none', background: 'transparent', position: 'relative' }}>
                    {previewUrl ? (
                      <ReactCrop
                        crop={crop}
                        onChange={(c, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c, percentCrop) => setCompletedCrop(percentCrop)}
                        style={{ maxHeight: '400px', display: 'flex', justifyContent: 'center' }}
                      >
                        <img src={previewUrl} className="image-preview" alt="Campo Original" />
                      </ReactCrop>
                    ) : (
                      <span style={{ color: '#9ca3af', textAlign: 'center', padding: '20px', display: 'block' }}>
                        Generando vista previa...
                      </span>
                    )}
                    <button
                      style={{ position: 'absolute', top: -10, right: -10, background: '#737373', color: 'white', border: '2px solid white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                      onClick={() => { setHasFile(false); setUploadedFile(null); setPreviewUrl(null); setCrop(null); setCompletedCrop(null); }}
                      title="Eliminar imagen"
                    >✕</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <div style={{ width: '100%', padding: '14px', border: '1px solid #8d4925', color: '#8d4925', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', backgroundColor: '#ffffff' }}>
                      ✓ Imagen Cargada
                    </div>

                    <button
                      onClick={handleUploadClick}
                      style={{ width: '100%', padding: '14px', border: '1px solid #0cd359', color: '#0cd359', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', backgroundColor: '#ffffff' }}
                    >
                      <IconImageIcon /> Cambiar imagen
                    </button>

                    <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#16a34a' }}>
                      <span style={{ fontSize: '1.1rem' }}>ⓘ</span>
                      <p style={{ margin: 0, lineHeight: '1.4' }}>Puedes cambiar de imagen si deseas procesar una diferente.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="upload-area" onClick={handleUploadClick}>
                    <span className="upload-icon">📂</span>
                    <span>Haz clic o arrastra una imagen aquí</span>
                    <span style={{ fontSize: '0.8rem', marginTop: '10px', opacity: 0.7 }}>Soporte JPG, PNG (Max 10MB)</span>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={handleUploadClick}
                    style={{ marginTop: 'auto' }}
                  >
                    Seleccionar Archivo
                  </button>
                </>
              )}
            </div>

            {/* Paso 2: Procesamiento */}
            <div className="card" style={{ opacity: hasFile ? 1 : 0.5, pointerEvents: hasFile ? 'auto' : 'none', transition: 'all 0.3s' }}>
              <h2 className="card-title title-font">Análisis de Suelo</h2>

              <div className={`image-wrapper ${isProcessing ? 'scanning' : ''}`}>
                <div className="overlay-scanner"></div>
                {showResults ? (
                  <img src={analyzedImage || "/bean_crop_analyzed.png"} className="image-preview" alt="Campo Analizado" />
                ) : hasFile ? (
                  <img src={previewUrl || "/bean_crop_field.png"} className="image-preview" alt="Preparado" style={{ filter: 'grayscale(50%)' }} />
                ) : (
                  <span style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                    Esperando origen de datos...
                  </span>
                )}
              </div>

              {hasFile && showResults && (
                <div style={{ marginTop: '15px', padding: '15px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>
                    <span>Escala estimada: {metadata && metadata.escala.includes('Recorte') ? '' : ''}</span>
                    <span style={{ fontWeight: 'bold' }}>{metadata ? metadata.escala : 'Automático'}</span>
                  </div>
                </div>
              )}

              {hasFile && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>⚙️</span> Calibración Avanzada {showAdvanced ? '▲' : '▼'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>(Uso técnico)</span>
                  </button>

                  {showAdvanced && (
                    <div style={{ marginTop: '10px', padding: '20px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', animation: 'fadeIn 0.3s ease', position: 'relative', zIndex: 10 }}>

                      <div style={{ marginBottom: '20px', background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#16a34a' }}>
                        <p style={{ margin: 0, lineHeight: '1.4' }}>ⓘ <strong>Aviso:</strong> Esta sección está destinada a personal técnico. La modificación de estos parámetros puede alterar la precisión del análisis y los resultados obtenidos.</p>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 100%' }}>
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <label style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>Sensibilidad de Detección de Maleza <span title="Aumenta este valor si la IA no detecta maleza pequeña o flores." style={{ cursor: 'help', color: '#94a3b8' }}>ⓘ</span></label>
                              <span style={{ fontSize: '0.8rem', color: '#0cd359', fontWeight: 'bold' }}>{sensibilidadMaleza}%</span>
                            </div>
                            <input type="range" min="1" max="100" value={sensibilidadMaleza} onChange={e => setSensibilidadMaleza(e.target.value)} style={{ width: '100%', accentColor: '#0cd359' }} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <label style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>Compensación de Suelo <span title="Si la IA confunde tierra seca con maleza, disminuye este valor." style={{ cursor: 'help', color: '#94a3b8' }}>ⓘ</span></label>
                              <span style={{ fontSize: '0.8rem', color: '#8d4925', fontWeight: 'bold' }}>{contrasteSuelo}%</span>
                            </div>
                            <input type="range" min="1" max="100" value={contrasteSuelo} onChange={e => setContrasteSuelo(e.target.value)} style={{ width: '100%', accentColor: '#8d4925' }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleProcess}
                disabled={isProcessing}
                style={{ marginTop: '15px' }}
              >
                {isProcessing ? '🔬 Recalculando...' : showResults ? '✓ Análisis Completado' : 'Iniciar Análisis'}
              </button>
            </div>

            {/* Paso 3: Resultados */}
            <div className="card" id="reporte-resultados-card" style={{
              opacity: showResults ? 1 : 0.4,
              pointerEvents: showResults ? 'auto' : 'none',
              transition: 'all 0.5s'
            }}>
              <h2 className="card-title title-font">Resultados de Muestra</h2>

              {/* TECHNICAL METADATA BADGES (Removed per request) */}

              <div className="donut-container" style={{ margin: '10px 0 20px 0' }}>
                {showResults ? (
                  <div className="modern-circle"></div>
                ) : (
                  <div className="modern-circle" style={{ background: '#e2e8f0', animation: 'none' }}></div>
                )}
              </div>

              <div className="stats-container">
                <div className="stat-row">
                  <div className="stat-header">
                    <span className="stat-name" style={{ color: '#0cd359', fontWeight: 'bold' }}>🌱 Planta</span>
                    <span style={{ color: '#0cd359', fontWeight: 'bold' }}>{showResults ? `${stats.planta}%` : '0%'}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill fill-planta" style={{ width: showResults ? `${stats.planta}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="stat-header">
                    <span className="stat-name" style={{ color: '#3b82f6', fontWeight: 'bold' }}>🍃 Maleza</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{showResults ? `${stats.maleza}%` : '0%'}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill fill-maleza" style={{ width: showResults ? `${stats.maleza}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="stat-header">
                    <span className="stat-name" style={{ color: '#8d4925', fontWeight: 'bold' }}>🟤 Suelo Desnudo</span>
                    <span style={{ color: '#8d4925', fontWeight: 'bold' }}>{showResults ? `${stats.suelo}%` : '0%'}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill fill-suelo" style={{ width: showResults ? `${stats.suelo}%` : '0%' }}></div>
                  </div>
                </div>
              </div>

              <div data-html2canvas-ignore="true" style={{ flexGrow: 1 }}></div>
              <div data-html2canvas-ignore="true" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
                <button
                  className="btn-secondary"
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  style={{ marginTop: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <IconDownload /> {isGenerating ? 'Generando Archivo PDF...' : 'Descargar PDF'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE DESCARGA Y WHATSAPP */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '40px', maxWidth: '450px' }}>
            <h3 style={{ color: '#8d4925', fontSize: '1.8rem', lineHeight: '1.2', marginBottom: '20px', fontWeight: 'bold' }}>
              ¡Reporte Descargado<br />Exitosamente!
            </h3>

            <p style={{ color: '#475569', marginBottom: '30px', fontSize: '1rem' }}>
              El archivo <strong>Reporte_MJ_Agrovision.pdf</strong> se ha descargado en tu equipo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '1rem'
                }}
              >
                <IconCloseCircle /> Cerrar Pestaña
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  handleResetDashboard();
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #0cd359',
                  color: '#0cd359',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '1rem'
                }}
              >
                <IconImageIcon /> Procesar otra imagen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AYUDA (TUTORIAL) */}
      {showHelpModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'left', padding: '40px' }}>
            <h2 className="title-font" style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#0cd359' }}>¿Cómo usar</span> MJ AGROVISION?
            </h2>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div style={{ background: '#f1f5f9', padding: '12px 18px', borderRadius: '50%', color: '#1e293b', fontWeight: 'bold' }}>1</div>
              <div>
                <h4 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '5px' }}>Sube tu imagen tomada con el dron</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>Ve al <strong>DASHBOARD</strong> y sube la imagen aérea generada por tu dron. El sistema procesará automáticamente el cultivo para identificar áreas de interes.</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div style={{ background: '#f1f5f9', padding: '12px 18px', borderRadius: '50%', color: '#1e293b', fontWeight: 'bold' }}>2</div>
              <div>
                <h4 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '5px' }}>Ejecuta el Análisis Inteligente</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>Presiona <strong>Iniciar Análisis</strong>. La IA escaneará el terreno y calculara porcentajes de Planta (Verde), Maleza (Azul) y Suelo (Marrón).</p>
              </div>
            </div>

            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div style={{ background: '#f1f5f9', padding: '12px 18px', borderRadius: '50%', color: '#1e293b', fontWeight: 'bold' }}>3</div>
              <div>
                <h4 style={{ color: '#1e293b', fontSize: '1.1rem', marginBottom: '5px' }}>Descarga tu Reporte en PDF</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>Obtén tu reporte directamente en tu equipo. El documento incluirá un resumen claro de las métricas y la comparación visual del análisis.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="btn-primary"
              style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }}
            >
              Entendido, comenzar a analizar
            </button>
          </div>
        </div>
      )}

      {/* HIDDEN 4-PAGE PDF TEMPLATES */}
      {showResults && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -100 }}>
          {/* PAGE 1: RESUMEN */}
          <div id="pdf-page-1" style={{ width: '794px', height: '1123px', backgroundColor: '#ffffff', padding: '60px', position: 'relative', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '80px' }} />
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>MJ Agrovision</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Reporte: REP-{new Date().getFullYear()}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Fecha: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <h2 style={{ fontSize: '32px', color: '#8d4925', margin: '0 0 20px 0' }}>Resumen</h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '40px' }}>

            </p>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
              <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🌱</div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '15px' }}>Cobertura Vegetal</p>
                <p style={{ margin: 0, fontSize: '36px', color: '#1e293b', fontWeight: '800' }}>{stats.planta}%</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>Área cubierta por cultivo</p>
              </div>
              <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🍃</div>
                <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', marginBottom: '15px' }}>Presencia de Maleza</p>
                <p style={{ margin: 0, fontSize: '36px', color: '#1e293b', fontWeight: '800' }}>{stats.maleza}%</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>Área cubierta por maleza</p>
              </div>
              <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🟤</div>
                <p style={{ margin: 0, fontSize: '12px', color: '#8d4925', fontWeight: 'bold', marginBottom: '15px' }}>Suelo Expuesto</p>
                <p style={{ margin: 0, fontSize: '36px', color: '#1e293b', fontWeight: '800' }}>{stats.suelo}%</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>Área sin cobertura vegetal</p>
              </div>
              <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️</div>
                <p style={{ margin: 0, fontSize: '12px', color: '#16a34a', fontWeight: 'bold', marginBottom: '15px' }}>Nivel de Riesgo</p>
                <p style={{ margin: 0, fontSize: '28px', color: stats.maleza > 15 ? '#ef4444' : (stats.maleza > 5 ? '#eab308' : '#16a34a'), fontWeight: '800' }}>
                  {stats.maleza > 15 ? 'ALTO' : (stats.maleza > 5 ? 'MEDIO' : 'BAJO')}
                </p>
                <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>Riesgo de competencia</p>
              </div>
            </div>

            <div style={{ padding: '30px', backgroundColor: '#f0fdf4', borderRadius: '15px', border: '1px solid #bbf7d0', marginBottom: '40px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px', background: 'white', borderRadius: '50%', padding: '5px' }}>✔️</span>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#166534' }}>Diagnóstico General</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>
                    {stats.maleza > 15
                      ? "Se detecta una invasión crítica de maleza que requiere aplicación urgente de control."
                      : (stats.maleza > 5 ? "La presencia de maleza es moderada " : "La presencia de maleza es mínima y no representa riesgo económico inmediato.")}
                  </p>
                </div>
              </div>
            </div>


            <div style={{ position: 'absolute', bottom: '30px', width: 'calc(100% - 120px)', textAlign: 'center', fontSize: '10px', color: '#cbd5e1' }}>01</div>
          </div>

          {/* PAGE 2: VISUAL ANALYSIS */}
          <div id="pdf-page-2" style={{ width: '794px', height: '1123px', backgroundColor: '#ffffff', padding: '60px', position: 'relative', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '80px' }} />
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>MJ Agrovision</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Reporte: REP-{new Date().getFullYear()}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Fecha: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <h2 style={{ fontSize: '32px', color: '#8d4925', margin: '0 0 10px 0' }}>Análisis Visual</h2>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '40px' }}></p>

            <div style={{ display: 'flex', gap: '30px', height: '700px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#166534', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '10px 10px 0 0' }}>Imagen Original</div>
                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                  {originalImageCropped ? (
                    <img src={originalImageCropped} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Imagen Original</div>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#166534', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '10px 10px 0 0' }}>Imagen Procesada</div>
                <div style={{ flex: 1, border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                  {analyzedImage ? (
                    <img src={analyzedImage} alt="Analizada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Imagen IA</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '30px', width: 'calc(100% - 120px)', textAlign: 'center', fontSize: '10px', color: '#cbd5e1' }}>02</div>
          </div>

          {/* PAGE 3: QUANTITATIVE RESULTS */}
          <div id="pdf-page-3" style={{ width: '794px', height: '1123px', backgroundColor: '#ffffff', padding: '60px', position: 'relative', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '80px' }} />
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>MJ Agrovision</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Reporte: REP-{new Date().getFullYear()}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Fecha: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <h2 style={{ fontSize: '32px', color: '#8d4925', margin: '0 0 40px 0' }}>Resultados Cuantitativos</h2>

            <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '60px' }}>
              {/* Fake Donut Chart via CSS/SVG */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <svg width="300" height="300" viewBox="0 0 36 36">
                  {/* Suelo (Background) */}
                  <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#8d4925" strokeWidth="8" strokeDasharray="100 0"></circle>

                  {/* Planta */}
                  <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#0cd359" strokeWidth="8" strokeDasharray={`${stats.planta} ${100 - stats.planta}`} strokeDashoffset="25"></circle>

                  {/* Maleza */}
                  <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="8" strokeDasharray={`${stats.maleza} ${100 - stats.maleza}`} strokeDashoffset={`${25 - stats.planta + 100}`}></circle>

                  {/* Center White Hole */}
                  <circle cx="18" cy="18" r="11" fill="white"></circle>
                  <text x="18" y="17" fontSize="3" textAnchor="middle" fill="#475569" fontWeight="bold">Distribución</text>
                  <text x="18" y="21" fontSize="3" textAnchor="middle" fill="#475569" fontWeight="bold">de Cobertura</text>
                </svg>
              </div>

              {/* Data Table */}
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#166534', color: 'white' }}>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Categoría</th>
                      <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Área (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                      <td style={{ padding: '20px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: '#1e293b' }}><div style={{ width: '12px', height: '12px', background: '#0cd359', borderRadius: '50%' }}></div> Planta</td>
                      <td style={{ padding: '20px 15px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>{stats.planta}%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <td style={{ padding: '20px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: '#1e293b' }}><div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%' }}></div> Maleza</td>
                      <td style={{ padding: '20px 15px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>{stats.maleza}%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                      <td style={{ padding: '20px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: '#1e293b' }}><div style={{ width: '12px', height: '12px', background: '#8d4925', borderRadius: '50%' }}></div> Suelo Desnudo</td>
                      <td style={{ padding: '20px 15px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>{stats.suelo}%</td>
                    </tr>
                    <tr style={{ background: '#f1f5f9' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#475569' }}>Total</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '15px', padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', background: 'white', borderRadius: '50%', padding: '5px' }}>ⓘ</span>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#166534' }}>Interpretación</h4>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#166534', lineHeight: '1.6', marginLeft: '50px' }}>
                El {stats.planta}% del área total está cubierta por cultivo sano, un {stats.maleza}% corresponde a infestación por maleza y el {stats.suelo}% restante representa suelo desnudo expuesto.
              </p>
            </div>

            <div style={{ position: 'absolute', bottom: '30px', width: 'calc(100% - 120px)', textAlign: 'center', fontSize: '10px', color: '#cbd5e1' }}>03</div>
          </div>
        </div>
      )}

    </div>
  );
}