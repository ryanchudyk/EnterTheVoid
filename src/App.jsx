import React, { useState, useEffect, useRef, useCallback } from 'react';

// Focus Commitment App v3
// Word-count-driven UI fade system
// The void respects your flow

const App = () => {
  const [stage, setStage] = useState('setup'); // setup, focus, complete
  const [commitment, setCommitment] = useState('');
  const [targetWords, setTargetWords] = useState(500);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [trackingMode, setTrackingMode] = useState('words'); // words or time
  const [content, setContent] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Fade system state
  const [wordsSinceFade, setWordsSinceFade] = useState(0);
  
  // Threshold state
  const [thresholdReached, setThresholdReached] = useState(false);
  const [glowOpacity, setGlowOpacity] = useState(0);
  const [doneButtonWordsSinceFade, setDoneButtonWordsSinceFade] = useState(20); // Start hidden
  const [doneButtonVisible, setDoneButtonVisible] = useState(false);
  const [hoveringDone, setHoveringDone] = useState(false);
  
  const textareaRef = useRef(null);
  const timerRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const fullscreenHintTimeoutRef = useRef(null);
  const prevWordCountRef = useRef(0);
  const thresholdReachedRef = useRef(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const progress = trackingMode === 'words' 
    ? Math.min((wordCount / targetWords) * 100, 100)
    : Math.min((elapsedSeconds / (targetMinutes * 60)) * 100, 100);
  const isComplete = progress >= 100;
  const bonusWords = trackingMode === 'words' ? Math.max(0, wordCount - targetWords) : 0;

  // Calculate UI opacity based on words typed since last visibility
  // 5% reduction per word, 50% = 10 words, 0% = 20 words
  const calculateOpacity = (wordsSince) => {
    return Math.max(0, 1 - (wordsSince * 0.05));
  };

  const uiOpacity = hoveringDone ? 1 : calculateOpacity(wordsSinceFade);
  
  // Progress bar, title, and encouragement all fade together (hidden post-threshold unless hovering)
  const progressOpacity = thresholdReached 
    ? (hoveringDone ? 1 : 0) 
    : uiOpacity;
  const titleOpacity = progressOpacity;
  const encouragementOpacity = progressOpacity;
  
  // Done button opacity - same fade system
  const doneButtonOpacity = hoveringDone ? 1 : calculateOpacity(doneButtonWordsSinceFade);

  // Timer for time-based tracking
  useEffect(() => {
    if (stage === 'focus' && trackingMode === 'time') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [stage, trackingMode]);

  // Handle threshold reached
  useEffect(() => {
    if (stage === 'focus' && isComplete && !thresholdReachedRef.current) {
      thresholdReachedRef.current = true;
      setThresholdReached(true);
      
      // Pulse the glow: fade in, hold briefly, fade out
      setGlowOpacity(1);
      setTimeout(() => {
        setGlowOpacity(0);
      }, 1200); // Hold for 1.2 seconds then fade out
      
      // Start idle timeout immediately for done button (5 seconds)
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = setTimeout(() => {
        setDoneButtonWordsSinceFade(10); // 10 words = 50% opacity
        setDoneButtonVisible(true);
      }, 5000);
    }
  }, [isComplete, stage]);

  // Handle word count changes and fade logic
  useEffect(() => {
    const newWordCount = wordCount;
    const wordsAdded = newWordCount - prevWordCountRef.current;
    
    if (wordsAdded > 0 && stage === 'focus') {
      // Words were added - increase fade counters
      setWordsSinceFade(prev => prev + wordsAdded);
      
      // Hide fullscreen hint when typing
      setShowFullscreenHint(false);
      
      // Track done button fade when typing post-threshold
      if (isComplete) {
        setDoneButtonWordsSinceFade(prev => prev + wordsAdded);
      }
      
      // Clear idle timeout
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      // Start idle timeout - 5 seconds post-threshold, 20 seconds pre-threshold
      const idleDelay = isComplete ? 5000 : 20000;
      idleTimeoutRef.current = setTimeout(() => {
        if (isComplete) {
          // Post-threshold: show done button at 50%
          setDoneButtonWordsSinceFade(10); // 10 words = 50% opacity
          setDoneButtonVisible(true);
        } else {
          // Pre-threshold: fade UI back to 50%
          setWordsSinceFade(10); // 10 words = 50% opacity
        }
      }, idleDelay);
    }
    
    prevWordCountRef.current = newWordCount;
  }, [wordCount, isComplete, stage]);

  // Intercept escape/quit attempts
  useEffect(() => {
    if (stage !== 'focus') return;
    
    const handleKeyDown = (e) => {
      if ((e.metaKey && (e.key === 'w' || e.key === 'q')) || e.key === 'Escape') {
        e.preventDefault();
        setShowExitWarning(true);
        setTimeout(() => setShowExitWarning(false), 3000);
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Handle fullscreen exit attempts
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFullscreen && stage === 'focus') {
        // They exited fullscreen - show hint
        setShowFullscreenHint(true);
        // Clear any existing timeout
        if (fullscreenHintTimeoutRef.current) {
          clearTimeout(fullscreenHintTimeoutRef.current);
        }
        // Hide hint after 5 seconds
        fullscreenHintTimeoutRef.current = setTimeout(() => {
          setShowFullscreenHint(false);
        }, 5000);
      } else if (isFullscreen) {
        // They re-entered fullscreen - hide hint
        setShowFullscreenHint(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [stage]);

  // Focus textarea when entering focus mode
  useEffect(() => {
    if (stage === 'focus' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [stage]);

  // Auto-scroll to keep cursor visible at bottom as you type
  useEffect(() => {
    if (stage === 'focus' && textareaRef.current) {
      const textarea = textareaRef.current;
      // Scroll to bottom to keep cursor visible
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, [content, stage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (fullscreenHintTimeoutRef.current) clearTimeout(fullscreenHintTimeoutRef.current);
    };
  }, []);

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      // Safari
      elem.webkitRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      // Safari
      document.webkitExitFullscreen();
    }
  };

  const handleDoubleClick = (e) => {
    // Only trigger if not clicking on textarea or buttons
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    requestFullscreen();
    setShowFullscreenHint(false);
  };

  const handleBegin = () => {
    if (!commitment.trim()) return;
    requestFullscreen();
    setStage('focus');
    prevWordCountRef.current = 0;
  };

  const handleFinish = () => {
    exitFullscreen();
    setStage('complete');
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleNewSession = () => {
    setStage('setup');
    setCommitment('');
    setContent('');
    setElapsedSeconds(0);
    setCopied(false);
    setThresholdReached(false);
    thresholdReachedRef.current = false;
    setWordsSinceFade(0);
    setGlowOpacity(0);
    setDoneButtonWordsSinceFade(20);
    setDoneButtonVisible(false);
    setShowFullscreenHint(false);
    prevWordCountRef.current = 0;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEncouragement = () => {
    if (thresholdReached) {
      return "You've done what you came to do.";
    }
    if (progress < 25) return "The hardest part is starting. You're already here.";
    if (progress < 50) return "You're finding your rhythm.";
    if (progress < 75) return "Halfway there. Keep going.";
    return "Almost. Don't stop now.";
  };

  // Setup Stage
  if (stage === 'setup') {
    return (
      <div style={styles.void}>
        <div style={styles.setupContainer}>
          <div style={styles.setupInner}>
            <h1 style={styles.setupTitle}>What matters most today?</h1>
            <p style={styles.setupSubtitle}>
              Name your commitment. Once you begin, the void holds you until it's done.
            </p>
            
            <input
              type="text"
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              placeholder="e.g., Write the introduction to Chapter 3"
              style={styles.commitmentInput}
              autoFocus
            />

            <div style={styles.thresholdSection}>
              <p style={styles.thresholdLabel}>Release threshold:</p>
              
              <div style={styles.modeToggle}>
                <button
                  onClick={() => setTrackingMode('words')}
                  style={{
                    ...styles.modeButton,
                    ...(trackingMode === 'words' ? styles.modeButtonActive : {})
                  }}
                >
                  Words
                </button>
                <button
                  onClick={() => setTrackingMode('time')}
                  style={{
                    ...styles.modeButton,
                    ...(trackingMode === 'time' ? styles.modeButtonActive : {})
                  }}
                >
                  Time
                </button>
              </div>

              {trackingMode === 'words' ? (
                <div style={styles.sliderContainer}>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={targetWords}
                    onChange={(e) => setTargetWords(Number(e.target.value))}
                    style={styles.slider}
                  />
                  <span style={styles.sliderValue}>{targetWords} words</span>
                </div>
              ) : (
                <div style={styles.sliderContainer}>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(Number(e.target.value))}
                    style={styles.slider}
                  />
                  <span style={styles.sliderValue}>{targetMinutes} minutes</span>
                </div>
              )}
            </div>

            <button
              onClick={handleBegin}
              disabled={!commitment.trim()}
              style={{
                ...styles.beginButton,
                opacity: commitment.trim() ? 1 : 0.4,
                cursor: commitment.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Enter the Void
            </button>

            <p style={styles.escapeNote}>
              Restart your machine to exit early. That's the only way out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Focus Stage
  if (stage === 'focus') {
    return (
      <div style={styles.void} onDoubleClick={handleDoubleClick}>
        {/* Exit Warning */}
        <div style={{
          ...styles.exitWarning,
          opacity: showExitWarning ? 1 : 0,
          transform: showExitWarning ? 'translateY(0)' : 'translateY(-20px)'
        }}>
          Not yet. Finish what you started.
        </div>

        {/* Fullscreen Hint */}
        <div style={{
          ...styles.fullscreenHint,
          opacity: showFullscreenHint ? 1 : 0,
          transform: showFullscreenHint ? 'translateY(0)' : 'translateY(10px)'
        }}>
          Double-click to return to the void
        </div>

        <div style={styles.focusContainer}>
          {/* Header - title stays hidden once faded */}
          <div style={styles.focusHeader}>
            <p style={{
              ...styles.commitmentDisplay,
              opacity: titleOpacity,
              transition: 'opacity 0.6s ease',
            }}>
              "{commitment}"
            </p>
            
            {/* Progress section - can fade back in on idle */}
            <div style={{
              ...styles.progressSection,
              opacity: progressOpacity,
              transition: 'opacity 0.6s ease',
            }}>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: thresholdReached ? '#7a9a7a' : '#c4b5a0',
                  }} 
                />
              </div>
              <p style={styles.progressText}>
                {trackingMode === 'words' 
                  ? `${wordCount} / ${targetWords} words`
                  : `${formatTime(elapsedSeconds)} / ${targetMinutes}:00`
                }
                {thresholdReached && ` ✓`}
              </p>
            </div>
          </div>

          {/* Writing Area - invisible container, text floats in the void */}
          <div style={{
            ...styles.writingContainer,
            boxShadow: glowOpacity > 0 
              ? `0 0 ${60 * glowOpacity}px rgba(122, 154, 122, ${0.4 * glowOpacity}), inset 0 0 ${30 * glowOpacity}px rgba(122, 154, 122, ${0.08 * glowOpacity})`
              : 'none',
            transition: 'box-shadow 0.8s ease',
          }}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin..."
              style={styles.textarea}
              spellCheck={true}
            />
          </div>

          {/* Encouragement - fades with progress bar */}
          <div style={{
            ...styles.encouragementContainer,
            opacity: encouragementOpacity,
            transition: 'opacity 0.6s ease',
          }}>
            <p style={styles.encouragement}>
              {getEncouragement()}
            </p>
          </div>

          {/* Done button - only post-threshold, with hover interaction */}
          {thresholdReached && (
            <div
              onMouseEnter={() => setHoveringDone(true)}
              onMouseLeave={() => setHoveringDone(false)}
              style={{
                ...styles.doneButtonContainer,
                opacity: doneButtonVisible || hoveringDone ? 1 : 0,
                pointerEvents: doneButtonVisible || hoveringDone ? 'auto' : 'none',
                transition: 'opacity 0.6s ease',
              }}
            >
              {/* Bonus bar - only visible on hover */}
              {hoveringDone && bonusWords > 0 && (
                <div style={styles.bonusSection}>
                  <div style={styles.bonusBar}>
                    <div 
                      style={{
                        ...styles.bonusFill,
                        width: `${Math.min((bonusWords / targetWords) * 100, 100)}%`,
                      }} 
                    />
                  </div>
                  <p style={styles.bonusText}>+{bonusWords} beyond your goal</p>
                </div>
              )}
              
              <button
                onClick={handleFinish}
                style={{
                  ...styles.doneButton,
                  opacity: doneButtonOpacity,
                  transition: 'opacity 0.3s ease',
                }}
              >
                I'm done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Complete Stage
  if (stage === 'complete') {
    return (
      <div style={styles.void}>
        <div style={styles.completeContainer}>
          <div style={styles.completeInner}>
            <div style={styles.checkmark}>✓</div>
            <h1 style={styles.completeTitle}>You did it.</h1>
            <p style={styles.completeSubtitle}>
              {trackingMode === 'words' 
                ? `${wordCount} words written`
                : `${formatTime(elapsedSeconds)} focused`
              }
              {bonusWords > 0 && trackingMode === 'words' && (
                <span style={styles.overDelivery}>
                  {` — ${bonusWords} beyond your goal`}
                </span>
              )}
            </p>
            
            {content && (
              <div style={styles.completedWorkSection}>
                <div style={styles.completedWorkPreview}>
                  {content.length > 500 ? content.substring(0, 500) + '...' : content}
                </div>
                <button
                  onClick={handleCopy}
                  style={styles.copyButton}
                >
                  {copied ? 'Copied!' : 'Copy Your Work'}
                </button>
              </div>
            )}

            <button
              onClick={handleNewSession}
              style={styles.newSessionButton}
            >
              Start Another Session
            </button>
          </div>
        </div>
      </div>
    );
  }
};

const styles = {
  void: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Crimson Pro", Georgia, serif',
  },

  // Setup styles
  setupContainer: {
    width: '100%',
    maxWidth: '540px',
    padding: '40px',
  },
  setupInner: {
    textAlign: 'center',
  },
  setupTitle: {
    fontSize: '32px',
    fontWeight: '300',
    color: '#e8e4e0',
    marginBottom: '12px',
    letterSpacing: '-0.5px',
  },
  setupSubtitle: {
    fontSize: '16px',
    color: '#6b6561',
    marginBottom: '48px',
    lineHeight: '1.6',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },
  commitmentInput: {
    width: '100%',
    padding: '20px 24px',
    fontSize: '18px',
    fontFamily: '"Crimson Pro", Georgia, serif',
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    color: '#e8e4e0',
    outline: 'none',
    marginBottom: '40px',
    textAlign: 'center',
    transition: 'border-color 0.2s ease',
  },
  thresholdSection: {
    marginBottom: '48px',
  },
  thresholdLabel: {
    fontSize: '13px',
    color: '#4a4744',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },
  modeToggle: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px',
  },
  modeButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontFamily: '"Inter", -apple-system, sans-serif',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#5a5754',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modeButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    color: '#e8e4e0',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  slider: {
    width: '200px',
    height: '4px',
    appearance: 'none',
    backgroundColor: '#1a1a1a',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: '18px',
    color: '#e8e4e0',
    minWidth: '100px',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },
  beginButton: {
    padding: '18px 48px',
    fontSize: '16px',
    fontFamily: '"Inter", -apple-system, sans-serif',
    fontWeight: '500',
    backgroundColor: '#e8e4e0',
    border: 'none',
    borderRadius: '8px',
    color: '#0a0a0a',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '32px',
  },
  escapeNote: {
    fontSize: '12px',
    color: '#3a3734',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },

  // Focus styles
  focusContainer: {
    width: '100%',
    maxWidth: '720px',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '40px',
    position: 'relative',
  },
  focusHeader: {
    textAlign: 'center',
    marginBottom: '32px',
    minHeight: '80px',
  },
  commitmentDisplay: {
    fontSize: '18px',
    fontStyle: 'italic',
    color: '#7a7670',
    marginBottom: '24px',
  },
  progressSection: {
    maxWidth: '400px',
    margin: '0 auto',
  },
  progressBar: {
    height: '3px',
    backgroundColor: '#1a1a1a',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.5s ease',
  },
  progressText: {
    fontSize: '13px',
    color: '#5a5754',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },
  // Invisible writing container - pure void
  writingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    padding: '32px',
    border: 'none',
  },
  textarea: {
    flex: 1,
    width: '100%',
    padding: '0 0 100vh 0', // Large bottom padding to keep cursor line at top
    fontSize: '20px',
    lineHeight: '1.8',
    fontFamily: '"Crimson Pro", Georgia, serif',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#d4d0cc',
    outline: 'none',
    resize: 'none',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
  },
  encouragementContainer: {
    textAlign: 'center',
    marginTop: '24px',
    minHeight: '24px',
  },
  encouragement: {
    fontSize: '14px',
    color: '#3a3734',
    fontStyle: 'italic',
    margin: 0,
  },
  exitWarning: {
    position: 'fixed',
    top: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '16px 32px',
    backgroundColor: '#1a0a0a',
    border: '1px solid #3a1a1a',
    borderRadius: '8px',
    color: '#c49494',
    fontSize: '14px',
    fontFamily: '"Inter", -apple-system, sans-serif',
    transition: 'all 0.3s ease',
    pointerEvents: 'none',
    zIndex: 100,
  },
  fullscreenHint: {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#4a4744',
    fontSize: '13px',
    fontFamily: '"Inter", -apple-system, sans-serif',
    transition: 'all 0.5s ease',
    pointerEvents: 'none',
    zIndex: 100,
  },
  
  // Done button and bonus section
  doneButtonContainer: {
    position: 'fixed',
    bottom: '40px',
    right: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '12px',
  },
  bonusSection: {
    textAlign: 'right',
  },
  bonusBar: {
    width: '150px',
    height: '2px',
    backgroundColor: '#1a2a1a',
    borderRadius: '1px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  bonusFill: {
    height: '100%',
    backgroundColor: '#7a9a7a',
    transition: 'width 0.3s ease',
  },
  bonusText: {
    fontSize: '12px',
    color: '#6a8a6a',
    fontFamily: '"Inter", -apple-system, sans-serif',
    margin: 0,
  },
  doneButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontFamily: '"Inter", -apple-system, sans-serif',
    backgroundColor: 'transparent',
    border: '1px solid #2a3a2a',
    borderRadius: '6px',
    color: '#6a7a6a',
    cursor: 'pointer',
  },

  // Complete styles
  completeContainer: {
    width: '100%',
    maxWidth: '540px',
    padding: '40px',
  },
  completeInner: {
    textAlign: 'center',
  },
  checkmark: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#0a1a0a',
    border: '2px solid #2a4a2a',
    color: '#7ac47a',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 32px',
  },
  completeTitle: {
    fontSize: '36px',
    fontWeight: '300',
    color: '#e8e4e0',
    marginBottom: '8px',
  },
  completeSubtitle: {
    fontSize: '16px',
    color: '#6b6561',
    marginBottom: '40px',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },
  overDelivery: {
    color: '#7a9a7a',
  },
  completedWorkSection: {
    marginBottom: '40px',
  },
  completedWorkPreview: {
    backgroundColor: '#080808',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    padding: '24px',
    color: '#8a8680',
    fontSize: '14px',
    lineHeight: '1.7',
    textAlign: 'left',
    maxHeight: '200px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  copyButton: {
    padding: '14px 32px',
    fontSize: '14px',
    fontFamily: '"Inter", -apple-system, sans-serif',
    fontWeight: '500',
    backgroundColor: '#1a2a1a',
    border: '1px solid #2a4a2a',
    borderRadius: '6px',
    color: '#7ac47a',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  newSessionButton: {
    padding: '14px 32px',
    fontSize: '14px',
    fontFamily: '"Inter", -apple-system, sans-serif',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#6a6660',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default App;
