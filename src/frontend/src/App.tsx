import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  Alert,
  Chip,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Stack,
  IconButton,
  CircularProgress,
  Snackbar,
} from '@mui/material'
import { Clear, CloudOff } from '@mui/icons-material'
import { api } from './api'
import type { QuizQuestion, CombinedScore } from './api'
import Admin from './Admin'
import Scoreboard from './Scoreboard'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import './App.css'

// Code version for tracking deployments
const FRONTEND_VERSION = "1.0.0"

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d32f2f',
    },
    secondary: {
      main: '#388e3c',
    },
    background: {
      default: '#f5f5f5',
    },
  },
})

const PARTICIPANTS = ['Miriam', 'Paula', 'Adriana', 'Lula', 'Diego', 'Carlos A', 'Padrino']

interface Predictions {
  [key: string]: string
}

function DraggableName({ name, isUsed }: { name: string; isUsed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${name}`,
    data: { name },
    disabled: isUsed,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : isUsed ? 0.3 : 1,
  }

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        ...style,
        cursor: isUsed ? 'not-allowed' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        display: 'inline-block',
        px: 1.5,
        py: 0.5,
        bgcolor: isUsed ? '#e0e0e0' : '#d32f2f',
        color: isUsed ? '#666' : 'white',
        borderRadius: 1,
        fontSize: '0.875rem',
        fontWeight: 500,
        '&:active': {
          cursor: isUsed ? 'not-allowed' : 'grabbing',
        },
      }}
    >
      {name}
    </Box>
  )
}

function DropZone({ person, prediction, onRemove }: { person: string; prediction: string; onRemove: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${person}`,
    data: { person },
  })

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 1.5,
        borderRadius: 1,
        bgcolor: isOver ? '#e3f2fd' : prediction ? '#e8f5e9' : '#f5f5f5',
        border: isOver ? '2px solid #1976d2' : '1px solid #ddd',
        transition: 'all 0.2s',
        minHeight: 44,
      }}
    >
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, minWidth: 60, color: '#333' }}>
        {person} →
      </Typography>
      {prediction ? (
        <Box display="flex" alignItems="center" gap={0.5} flex={1}>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: '#388e3c',
              color: 'white',
              borderRadius: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {prediction}
          </Box>
          <IconButton size="small" onClick={onRemove} sx={{ ml: 'auto', p: 0.5 }}>
            <Clear fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Typography sx={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
          arrastra aquí
        </Typography>
      )}
    </Box>
  )
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'admin' | 'scoreboard'>('home')
  const [userName, setUserName] = useState('')
  const [predictions, setPredictions] = useState<Predictions>({})
  const [submitted, setSubmitted] = useState(false)
  const [activeDrag, setActiveDrag] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [combinedScore, setCombinedScore] = useState<CombinedScore | null>(null)
  const [backendVersion, setBackendVersion] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    checkHealth()
    loadParticipantsStatus()
    loadBackendVersion()
  }, [])

  const loadBackendVersion = async () => {
    try {
      const data = await api.getVersion()
      setBackendVersion(data.backend)
    } catch (err) {
      console.error('Failed to load version:', err)
    }
  }

  useEffect(() => {
    if (userName) {
      loadUserPredictions()
      // Cargar preguntas del quiz para verificar si hay pendientes
      checkPendingQuizQuestions()
    }
  }, [userName])

  const checkPendingQuizQuestions = async () => {
    try {
      const questions = await api.getQuizQuestions(userName)
      // Si hay preguntas pendientes y ya envió predicciones
      if (questions.length > 0) {
        // El usuario tiene preguntas pendientes
        // Por ahora no hacemos nada, pero podríamos mostrar un botón para continuar
      } else {
        // No hay preguntas pendientes, verificar si ya completó todo
        const score = await api.getCombinedScore(userName)
        if (score.totalQuestions > 0) {
          // Usuario ya completó todo
          setCombinedScore(score)
          setShowSummary(true)
        }
      }
    } catch (err) {
      console.error('Error checking quiz status:', err)
    }
  }

  const checkHealth = async () => {
    const healthy = await api.healthCheck()
    setIsOnline(healthy)
  }

  const loadUserPredictions = async () => {
    try {
      setLoading(true)
      const data = await api.getUserPredictions(userName)
      if (data) {
        setPredictions(data.predictions)
        // No marcar como submitted automáticamente, permitir edición
        setSubmitted(false)
      } else {
        setPredictions({})
        setSubmitted(false)
      }
    } catch (err) {
      console.error('Error loading predictions:', err)
      // No marcar como offline, 404 es una respuesta válida
      setPredictions({})
      setSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  const loadParticipantsStatus = async () => {
    try {
      const status = await api.getParticipantsStatus()
      setSubmittedCount(status.submittedCount)
    } catch (err) {
      console.error('Error loading status:', err)
      // No afecta el estado online
    }
  }

  const loadQuizQuestions = async () => {
    try {
      setLoadingQuiz(true)
      const questions = await api.getQuizQuestions(userName)
      setQuizQuestions(questions)
      
      // Si no hay preguntas pendientes, no mostrar el quiz
      if (questions.length === 0) {
        setShowQuiz(false)
      }
    } catch (err) {
      console.error('Error loading quiz questions:', err)
      setError('Error al cargar las preguntas del quiz')
    } finally {
      setLoadingQuiz(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag(event.active.data.current?.name || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDrag(null)

    if (over && active.data.current && over.data.current) {
      const draggedName = active.data.current.name
      const targetPerson = over.data.current.person

      if (draggedName !== targetPerson) {
        setPredictions((prev) => ({
          ...prev,
          [targetPerson]: draggedName,
        }))
      }
    }
  }

  const handleRemovePrediction = (person: string) => {
    setPredictions((prev) => {
      const newPredictions = { ...prev }
      delete newPredictions[person]
      return newPredictions
    })
  }

  const handleSubmit = async () => {
    if (!userName) {
      setError('Por favor ingresa tu nombre')
      return
    }

    const incomplete = PARTICIPANTS.some((person) => !predictions[person])
    if (incomplete) {
      setError('Por favor completa todas las predicciones')
      return
    }

    try {
      setLoading(true)
      await api.submitPredictions(userName, predictions)
      setSubmitted(true)
      setError(null)
      
      // Load quiz questions and start quiz
      await loadQuizQuestions()
      setShowQuiz(true)
      setCurrentQuestion(0)
      setQuizScore(0)
      
      await loadParticipantsStatus()
    } catch (err) {
      console.error('Error submitting predictions:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar las predicciones')
      // Verificar conectividad solo si falla el submit
      await checkHealth()
    } finally {
      setLoading(false)
    }
  }

  const handleQuizAnswer = async (answer: string) => {
    if (!quizQuestions[currentQuestion]) return

    try {
      // Submit answer to server
      const result = await api.submitQuizAnswer(userName, quizQuestions[currentQuestion].id, answer)
      
      if (result.isCorrect) {
        setQuizScore(quizScore + 1)
      }

      // Move to next question or finish
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        // Quiz finished - load combined score and show summary immediately
        try {
          const score = await api.getCombinedScore(userName)
          setCombinedScore(score)
          setShowQuiz(false)
          setShowSummary(true)
        } catch (err) {
          console.error('Error loading combined score:', err)
          setShowQuiz(false)
          setSubmitted(false)
        }
      }
    } catch (err) {
      console.error('Error submitting quiz answer:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la respuesta'
      
      // Si la pregunta ya fue contestada, pasar a la siguiente
      if (errorMessage.includes('already been answered')) {
        if (currentQuestion < quizQuestions.length - 1) {
          setCurrentQuestion(currentQuestion + 1)
        } else {
          setShowQuiz(false)
          setSubmitted(false)
        }
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleReset = () => {
    setUserName('')
    setPredictions({})
    setSubmitted(false)
    setShowSummary(false)
    setCombinedScore(null)
  }

  const usedNames = new Set(Object.values(predictions))

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {currentPage === 'admin' ? (
        <>
          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            <Button variant="outlined" onClick={() => setCurrentPage('home')}>
              ← Volver al juego
            </Button>
          </Box>
          <Admin />
        </>
      ) : currentPage === 'scoreboard' ? (
        <>
          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            <Button variant="outlined" onClick={() => setCurrentPage('home')}>
              ← Volver
            </Button>
          </Box>
          <Scoreboard onBack={() => setCurrentPage('home')} />
        </>
      ) : (
        <Box
          sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            py: { xs: 2, md: 4 },
            px: { xs: 1, md: 2 },
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderRadius: 2,
                background: 'white',
              }}
            >
              <Box textAlign="center" mb={2}>
                <Typography variant="h5" component="h1" fontWeight="bold" color="primary" sx={{ fontSize: { xs: '1.2rem', md: '1.8rem' }, mb: 1 }}>
                  🎄 Bingo Amigo Invisible
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                  Revelación: 24 Dic
                </Typography>
                {!isOnline && (
                  <Chip
                    icon={<CloudOff />}
                  label="Sin conexión"
                  color="error"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>

            {loading && (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            )}

            {!submitted && !loading ? (
              <Box>
                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <InputLabel>Tu Nombre</InputLabel>
                  <Select value={userName} onChange={(e) => setUserName(e.target.value)} label="Tu Nombre" disabled={loading}>
                    {PARTICIPANTS.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {userName && !showSummary && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <Box mb={2}>
                      <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                        Nombres:
                      </Typography>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          bgcolor: '#fff9e6',
                          border: '1px solid #ffc107',
                        }}
                      >
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {PARTICIPANTS.map((name) => (
                            <DraggableName key={name} name={name} isUsed={usedNames.has(name)} />
                          ))}
                        </Box>
                      </Paper>
                    </Box>

                    <Stack spacing={1}>
                      {PARTICIPANTS.map((person) => (
                        <DropZone
                          key={person}
                          person={person}
                          prediction={predictions[person]}
                          onRemove={() => handleRemovePrediction(person)}
                        />
                      ))}
                    </Stack>

                    <DragOverlay>
                      {activeDrag ? (
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: '#d32f2f',
                            color: 'white',
                            borderRadius: 1,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            opacity: 0.9,
                          }}
                        >
                          {activeDrag}
                        </Box>
                      ) : null}
                    </DragOverlay>

                    <Box mt={2} textAlign="center">
                      <Button
                        variant="contained"
                        size="medium"
                        onClick={handleSubmit}
                        disabled={loading || !isOnline}
                        sx={{ px: 4 }}
                      >
                        {loading ? <CircularProgress size={20} /> : 'Guardar'}
                      </Button>
                    </Box>
                  </DndContext>
                )}

                {userName && showSummary && combinedScore && (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      ✅ ¡Todo completado!
                    </Alert>
                    
                    <Card sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
                        🎯 Tus Predicciones
                      </Typography>
                      <Stack spacing={1}>
                        {PARTICIPANTS.map((person) => (
                          <Box
                            key={person}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1,
                              bgcolor: '#f5f5f5',
                              borderRadius: 1,
                            }}
                          >
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, minWidth: 80 }}>
                              {person} →
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: '#388e3c', fontWeight: 500 }}>
                              {predictions[person]}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Card>

                    <Card sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
                        📊 Resumen Total
                      </Typography>
                      
                      {!combinedScore.hasAdminAnswers && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Las respuestas correctas aún no han sido publicadas. Tu puntaje se mostrará cuando el administrador ingrese las respuestas.
                        </Alert>
                      )}

                      {combinedScore.hasAdminAnswers && (
                        <>
                          <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, textAlign: 'center', color: '#1976d2' }}>
                              {combinedScore.totalCorrect}/{combinedScore.totalQuestions}
                            </Typography>
                            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                              Score: <strong>{combinedScore.score.toFixed(1)}%</strong>
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Quiz
                              </Typography>
                              <Typography variant="h6">
                                {combinedScore.quizCorrect}/{combinedScore.quizTotal}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Predicciones
                              </Typography>
                              <Typography variant="h6">
                                {combinedScore.predictionsCorrect}/{combinedScore.predictionsTotal}
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Card>

                    <Box mt={2} textAlign="center" display="flex" gap={1} justifyContent="center">
                      {combinedScore.hasAdminAnswers && (
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => setCurrentPage('scoreboard')}
                          sx={{ mr: 1 }}
                        >
                          Ver Tabla de Posiciones
                        </Button>
                      )}
                      <Button variant="outlined" size="small" onClick={handleReset}>
                        Volver
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : !loading && !showQuiz && !showSummary ? (
              <Box textAlign="center">
                <Alert severity="success" sx={{ mb: 2, py: 0.5 }}>
                  ✅ Guardado
                </Alert>
                <Button variant="outlined" size="small" onClick={handleReset}>
                  Modificar
                </Button>
              </Box>
            ) : null}

            {showQuiz && (
              <Box mt={2}>
                {loadingQuiz ? (
                  <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                  </Box>
                ) : quizQuestions.length > 0 && quizQuestions[currentQuestion] ? (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600, mb: 2 }}>
                      🎮 Quiz - {userName}
                    </Typography>
                    <Card sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
                        Pregunta {currentQuestion + 1} de {quizQuestions.length}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontSize: '0.95rem', fontWeight: 500, mb: 2 }}>
                        {quizQuestions[currentQuestion].question}
                      </Typography>
                      <Stack spacing={1}>
                        {quizQuestions[currentQuestion].options.map((option, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            onClick={() => handleQuizAnswer(option)}
                            sx={{
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              py: 1,
                              fontSize: '0.85rem',
                            }}
                          >
                            {option}
                          </Button>
                        ))}
                      </Stack>
                    </Card>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No hay preguntas disponibles
                  </Alert>
                )}
              </Box>
            )}

            {submittedCount > 0 && !showQuiz && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  Participantes: {submittedCount}/{PARTICIPANTS.length}
                </Typography>
              </Box>
            )}

            <Box textAlign="center" mt={2}>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => setCurrentPage('scoreboard')}
                sx={{ fontSize: '0.75rem', mr: 1 }}
              >
                Scoreboard
              </Button>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => setCurrentPage('admin')}
                sx={{ fontSize: '0.75rem' }}
              >
                Admin
              </Button>
            </Box>
            
            <Box textAlign="center" mt={2}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Frontend: v{FRONTEND_VERSION} | Backend: v{backendVersion || '...'}
              </Typography>
            </Box>
          </Paper>
        </Container>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
      )}
    </ThemeProvider>
  )
}

export default App
