import React, { useState, useRef, useCallback, useEffect } from 'react';

/* ─── Constants ─── */
const GRID_SIZES = [3, 4, 5];
const ACCENT = '#39ff14'; // neon green — matching original app

/* ─── Styles ─── */
const G = {
  bg: '#0a0a0a',
  surface: '#111111',
  border: '#1e1e1e',
  borderHover: '#2a2a2a',
  text: '#f0f0f0',
  muted: '#555',
  accent: ACCENT,
  accentDim: 'rgba(57,255,20,0.12)',
  fontDisplay: "'Space Mono', monospace",
  fontBody: "'Space Grotesk', sans-serif",
};

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; color: ${G.text}; font-family: ${G.fontBody}; }
  
  .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 0 16px 60px; }

  /* ── Header ── */
  .header { width: 100%; max-width: 900px; padding: 32px 0 24px; display: flex; align-items: baseline; gap: 16px; border-bottom: 1px solid ${G.border}; margin-bottom: 48px; }
  .header-title { font-family: ${G.fontDisplay}; font-size: clamp(18px, 4vw, 26px); font-weight: 700; letter-spacing: -0.5px; color: ${G.text}; }
  .header-dot { width: 8px; height: 8px; border-radius: 50%; background: ${G.accent}; flex-shrink: 0; box-shadow: 0 0 8px ${G.accent}; margin-bottom: 3px; }
  .header-sub { font-size: 13px; color: ${G.muted}; font-family: ${G.fontBody}; letter-spacing: 0.3px; margin-left: auto; }

  /* ── Upload Zone ── */
  .upload-zone { width: 100%; max-width: 560px; aspect-ratio: 4/3; border: 1.5px dashed ${G.border}; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; cursor: pointer; transition: border-color 0.2s, background 0.2s; position: relative; overflow: hidden; }
  .upload-zone:hover, .upload-zone.drag-over { border-color: ${G.accent}; background: ${G.accentDim}; }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .upload-icon { font-size: 36px; opacity: 0.4; }
  .upload-label { font-size: 14px; color: ${G.muted}; text-align: center; line-height: 1.5; }
  .upload-label span { color: ${G.accent}; }
  .upload-preview { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  .upload-preview-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
  .upload-zone:hover .upload-preview-overlay { opacity: 1; }
  .upload-preview-overlay span { font-size: 13px; color: ${G.text}; background: rgba(0,0,0,0.7); padding: 6px 14px; border-radius: 2px; }

  /* ── Controls ── */
  .controls { width: 100%; max-width: 560px; margin-top: 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .grid-label { font-size: 12px; color: ${G.muted}; font-family: ${G.fontDisplay}; letter-spacing: 0.5px; }
  .grid-btn { width: 38px; height: 38px; border: 1.5px solid ${G.border}; background: transparent; color: ${G.text}; font-family: ${G.fontDisplay}; font-size: 14px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
  .grid-btn:hover { border-color: ${G.accent}; color: ${G.accent}; }
  .grid-btn.active { border-color: ${G.accent}; background: ${G.accentDim}; color: ${G.accent}; }
  .start-btn { margin-left: auto; padding: 0 24px; height: 38px; background: ${G.accent}; color: #000; border: none; font-family: ${G.fontDisplay}; font-size: 13px; font-weight: 700; cursor: pointer; border-radius: 2px; letter-spacing: 0.5px; transition: opacity 0.15s, box-shadow 0.15s; box-shadow: 0 0 16px rgba(57,255,20,0.3); }
  .start-btn:hover { opacity: 0.9; box-shadow: 0 0 24px rgba(57,255,20,0.5); }
  .start-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }

  /* ── Puzzle Board ── */
  .puzzle-wrap { display: flex; flex-direction: column; align-items: center; width: 100%; gap: 20px; }
  .puzzle-meta { width: 100%; max-width: 560px; display: flex; justify-content: space-between; align-items: center; }
  .puzzle-moves { font-family: ${G.fontDisplay}; font-size: 13px; color: ${G.muted}; }
  .puzzle-moves span { color: ${G.text}; font-size: 16px; }
  .reset-btn { font-size: 12px; color: ${G.muted}; background: none; border: 1px solid ${G.border}; padding: 5px 12px; cursor: pointer; border-radius: 2px; font-family: ${G.fontBody}; transition: border-color 0.15s, color 0.15s; }
  .reset-btn:hover { border-color: ${G.borderHover}; color: ${G.text}; }

  .board { display: grid; border: 1px solid ${G.border}; cursor: grab; user-select: none; touch-action: none; }
  .board:active { cursor: grabbing; }
  .piece { position: relative; border: 1px solid ${G.border}; overflow: hidden; transition: box-shadow 0.1s; background: #111; }
  .piece.dragging-source { opacity: 0.35; }
  .piece.drag-over { box-shadow: inset 0 0 0 2px ${G.accent}; }
  .piece canvas { display: block; width: 100%; height: 100%; pointer-events: none; }
  .piece-num { position: absolute; top: 4px; left: 5px; font-family: ${G.fontDisplay}; font-size: 10px; color: rgba(255,255,255,0.35); pointer-events: none; }

  /* ── Solved overlay ── */
  .solved-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  .solved-card { background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 4px; padding: 48px 40px; width: min(480px, 90vw); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .solved-trophy { font-size: 52px; animation: pop 0.5s cubic-bezier(.36,.07,.19,.97); }
  @keyframes pop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
  .solved-title { font-family: ${G.fontDisplay}; font-size: 22px; color: ${G.accent}; text-shadow: 0 0 20px ${G.accent}; letter-spacing: 1px; }
  .solved-stats { font-size: 14px; color: ${G.muted}; }
  .solved-stats strong { color: ${G.text}; }
  .name-row { display: flex; gap: 8px; width: 100%; margin-top: 4px; }
  .name-input { flex: 1; background: ${G.bg}; border: 1.5px solid ${G.border}; color: ${G.text}; font-family: ${G.fontBody}; font-size: 15px; padding: 10px 14px; border-radius: 2px; outline: none; transition: border-color 0.15s; }
  .name-input:focus { border-color: ${G.accent}; }
  .name-input::placeholder { color: ${G.muted}; }
  .play-again-btn { width: 100%; padding: 12px; background: ${G.accent}; color: #000; border: none; font-family: ${G.fontDisplay}; font-size: 14px; font-weight: 700; cursor: pointer; border-radius: 2px; letter-spacing: 0.5px; transition: opacity 0.15s; margin-top: 4px; }
  .play-again-btn:hover { opacity: 0.85; }
  .thanks-msg { font-size: 14px; color: ${G.accent}; font-family: ${G.fontDisplay}; }
`;

/* ─── Helpers ─── */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isSolved(order) {
  return order.every((v, i) => v === i);
}

/* ─── PuzzleBoard Component ─── */
function PuzzleBoard({ imageSrc, gridSize, onReset }) {
  const [order, setOrder] = useState(() => shuffleArray([...Array(gridSize * gridSize).keys()]));
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const canvasRefs = useRef([]);
  const imgRef = useRef(null);
  const [boardSize, setBoardSize] = useState(500);

  // Responsive board size
  useEffect(() => {
    const update = () => {
      const w = Math.min(window.innerWidth - 32, 560);
      setBoardSize(w);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const pieceSize = Math.floor(boardSize / gridSize);

  // Load image and draw pieces into canvases
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      drawAllPieces(img, order);
    };
    img.src = imageSrc;
  }, [imageSrc]); // eslint-disable-line

  useEffect(() => {
    if (imgRef.current) drawAllPieces(imgRef.current, order);
  }, [order, pieceSize, gridSize]); // eslint-disable-line

  const drawAllPieces = (img, ord) => {
    const srcW = img.naturalWidth / gridSize;
    const srcH = img.naturalHeight / gridSize;
    ord.forEach((pieceIdx, slotIdx) => {
      const canvas = canvasRefs.current[slotIdx];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = pieceSize;
      canvas.height = pieceSize;
      const srcRow = Math.floor(pieceIdx / gridSize);
      const srcCol = pieceIdx % gridSize;
      ctx.drawImage(img, srcCol * srcW, srcRow * srcH, srcW, srcH, 0, 0, pieceSize, pieceSize);
    });
  };

  // Drag handlers (mouse)
  const onDragStart = (idx) => setDragSrc(idx);
  const onDragEnter = (idx) => setDragOver(idx);
  const onDragEnd = () => { setDragOver(null); };
  const onDrop = useCallback((targetIdx) => {
    if (dragSrc === null || dragSrc === targetIdx) { setDragSrc(null); setDragOver(null); return; }
    const next = [...order];
    [next[dragSrc], next[targetIdx]] = [next[targetIdx], next[dragSrc]];
    setOrder(next);
    setMoves(m => m + 1);
    setDragSrc(null);
    setDragOver(null);
    if (isSolved(next)) setTimeout(() => setSolved(true), 180);
  }, [dragSrc, order]);

  // Touch drag state
  const touchState = useRef({ srcIdx: null, startX: 0, startY: 0 });

  const onTouchStart = (idx, e) => {
    const t = e.touches[0];
    touchState.current = { srcIdx: idx, startX: t.clientX, startY: t.clientY };
    setDragSrc(idx);
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const idx = el?.closest('[data-idx]')?.getAttribute('data-idx');
    setDragOver(idx !== undefined && idx !== null ? Number(idx) : null);
  };

  const onTouchEnd = () => {
    if (dragOver !== null && dragOver !== dragSrc && dragSrc !== null) {
      onDrop(dragOver);
    } else {
      setDragSrc(null);
      setDragOver(null);
    }
    touchState.current.srcIdx = null;
  };

  const handlePlayAgain = () => {
    setSubmitted(false);
    setPlayerName('');
    setSolved(false);
    setMoves(0);
    setOrder(shuffleArray([...Array(gridSize * gridSize).keys()]));
  };

  const handleSubmit = () => {
    if (playerName.trim()) setSubmitted(true);
  };

  return (
    <div className="puzzle-wrap">
      <div className="puzzle-meta">
        <div className="puzzle-moves">MOVES <span>{moves}</span></div>
        <button className="reset-btn" onClick={onReset}>← New image</button>
      </div>

      <div
        className="board"
        style={{ width: pieceSize * gridSize, gridTemplateColumns: `repeat(${gridSize}, ${pieceSize}px)` }}
        onDragOver={e => e.preventDefault()}
      >
        {order.map((pieceIdx, slotIdx) => (
          <div
            key={slotIdx}
            data-idx={slotIdx}
            className={`piece${dragSrc === slotIdx ? ' dragging-source' : ''}${dragOver === slotIdx ? ' drag-over' : ''}`}
            style={{ width: pieceSize, height: pieceSize }}
            draggable
            onDragStart={() => onDragStart(slotIdx)}
            onDragEnter={() => onDragEnter(slotIdx)}
            onDragEnd={onDragEnd}
            onDrop={() => onDrop(slotIdx)}
            onTouchStart={e => onTouchStart(slotIdx, e)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <canvas ref={el => canvasRefs.current[slotIdx] = el} />
          </div>
        ))}
      </div>

      {solved && (
        <div className="solved-overlay">
          <div className="solved-card">
            <div className="solved-trophy">🏆</div>
            <div className="solved-title">PUZZLE COMPLETE!</div>
            <div className="solved-stats">Solved in <strong>{moves}</strong> moves on a {gridSize}×{gridSize} grid</div>
            {!submitted ? (
              <>
                <div className="name-row">
                  <input
                    className="name-input"
                    placeholder="Enter your name…"
                    value={playerName}
                    maxLength={20}
                    onChange={e => setPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                  />
                </div>
                <button className="play-again-btn" onClick={handleSubmit}>
                  {playerName.trim() ? 'SUBMIT →' : 'SKIP →'}
                </button>
              </>
            ) : (
              <>
                {playerName.trim() && <div className="thanks-msg">Nice work, {playerName}! 🎉</div>}
                <button className="play-again-btn" onClick={handlePlayAgain}>PLAY AGAIN</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [gridSize, setGridSize] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setImageSrc(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleStart = () => {
    if (imageSrc) setPlaying(true);
  };

  const handleReset = () => {
    setPlaying(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="header-dot" />
          <h1 className="header-title">LIVE PUZZLE</h1>
          <span className="header-sub">drag & drop to solve</span>
        </header>

        {!playing ? (
          <>
            <div
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
              {imageSrc ? (
                <>
                  <img src={imageSrc} alt="preview" className="upload-preview" />
                  <div className="upload-preview-overlay"><span>Change photo</span></div>
                </>
              ) : (
                <>
                  <div className="upload-icon">⬆</div>
                  <div className="upload-label">
                    Drop a photo here or <span>browse</span><br />
                    JPG, PNG, WEBP — any size
                  </div>
                </>
              )}
            </div>

            <div className="controls">
              <span className="grid-label">GRID</span>
              {GRID_SIZES.map(s => (
                <button
                  key={s}
                  className={`grid-btn${gridSize === s ? ' active' : ''}`}
                  onClick={() => setGridSize(s)}
                >
                  {s}×{s}
                </button>
              ))}
              <button className="start-btn" disabled={!imageSrc} onClick={handleStart}>
                START →
              </button>
            </div>
          </>
        ) : (
          <PuzzleBoard
            key={`${imageSrc}-${gridSize}`}
            imageSrc={imageSrc}
            gridSize={gridSize}
            onReset={handleReset}
          />
        )}
      </div>
    </>
  );
}
