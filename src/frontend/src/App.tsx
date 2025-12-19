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
  CardContent,
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
import { CardGiftcard, Celebration, Visibility, Clear, DragIndicator, CloudOff } from '@mui/icons-material'
import { api } from './api'
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
const REVEAL_DATE = new Date('2024-12-24')

interface Predictions {
  [key: string]: string
}

interface UserPrediction {
  userName: string
  predictions: Predictions
  timestamp: string
}

function DraggableName({ name, isUsed }: { name: string; isUsed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${name}`,
    data: { name },
    disabled: isUsed,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : isUsed ? 0.4 : 1,
  }

  return (
    <Chip
      ref={setNodeRef}
      label={name}
      {...listeners}
      {...attributes}
      icon={<DragIndicator />}
      sx={{
        ...style,
        cursor: isUsed ? 'not-allowed' : 'grab',
        fontSize: '1rem',
        py: 2.5,
        px: 1,
        '&:active': {
          cursor: isUsed ? 'not-allowed' : 'grabbing',
        },
        touchAction: 'none',
        userSelect: 'none',
      }}
      color={isUsed ? 'default' : 'primary'}
      variant={isUsed ? 'outlined' : 'filled'}
    />
  )
}

function DropZone({ person, prediction, onRemove }: { person: string; prediction: string; onRemove: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${person}`,
    data: { person },
  })

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: 2,
        minHeight: 100,
        background: isOver
          ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
          : prediction
            ? 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)'
            : 'white',
        border: isOver ? '2px dashed #1976d2' : '2px dashed #ccc',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
        ¿Quién es el amigo invisible de {person}?
      </Typography>
      {prediction ? (
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Chip label={prediction} color="success" sx={{ fontSize: '1rem', py: 2 }} />
          <IconButton size="small" onClick={onRemove} color="error">
            <Clear />
          </IconButton>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.disabled',
            fontStyle: 'italic',
          }}
        >
          Arrastra un nombre aquí
        </Box>
      )}
    </Card>
  )
}

function App() {
  const [userName, setUserName] = useState('')
  const [predictions, setPredictions] = useState<Predictions>({})
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [allPredictions, setAllPredictions] = useState<UserPrediction[]>([])
  const [activeDrag, setActiveDrag] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [canReveal, setCanReveal] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

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
  }, [])

  useEffect(() => {
    if (userName) {
      loadUserPredictions()
    }
  }, [userName])

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

  const loadAllPredictions = async () => {
    try {
      setLoading(true)
      const result = await api.getAllPredictions()
      setCanReveal(result.canReveal)
      setAllPredictions(result.data)
      setShowResults(result.canReveal)
    } catch (err) {
      console.error('Error loading all predictions:', err)
      setError(err instanceof Error ? err.message : 'Error loading predictions')
    } finally {
      setLoading(false)
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
      const result = await api.submitPredictions(userName, predictions)
      setSubmitted(true)
      setError(null)
      
      // Mostrar mensaje de confirmación
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
      
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

  const handleReset = () => {
    setUserName('')
    setPredictions({})
    setSubmitted(false)
  }

  const usedNames = new Set(Object.values(predictions))

  const handleShowResults = async () => {
    if (!showResults) {
      await loadAllPredictions()
    } else {
      setShowResults(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: { xs: 2, md: 4 },
          px: { xs: 1, md: 2 },
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={6}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
            }}
          >
            <Box textAlign="center" mb={3}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={{ xs: 1, md: 2 }} mb={2} flexWrap="wrap">
                <CardGiftcard sx={{ fontSize: { xs: 32, md: 48 }, color: 'primary.main' }} />
                <Typography variant="h4" component="h1" fontWeight="bold" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.5rem' } }}>
                  🎄 Bingo del Amigo Invisible 🎁
                </Typography>
                <Celebration sx={{ fontSize: { xs: 32, md: 48 }, color: 'secondary.main' }} />
              </Box>
              <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                ¿Quién es el amigo invisible de quién?
              </Typography>
              <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap" mt={1}>
                <Chip
                  label={`Revelación: 24 de Diciembre ${REVEAL_DATE.getFullYear()}`}
                  color="secondary"
                />
                {!isOnline && (
                  <Chip
                    icon={<CloudOff />}
                    label="Sin conexión al servidor"
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </Box>

            {loading && (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            )}

            {!submitted && !loading ? (
              <Box>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Tu Nombre</InputLabel>
                  <Select value={userName} onChange={(e) => setUserName(e.target.value)} label="Tu Nombre" disabled={loading}>
                    {PARTICIPANTS.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {userName && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <Box mb={3}>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                        📋 Nombres disponibles (arrastra hacia abajo):
                      </Typography>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)',
                          border: '2px solid #ffc107',
                        }}
                      >
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          {PARTICIPANTS.map((name) => (
                            <DraggableName key={name} name={name} isUsed={usedNames.has(name)} />
                          ))}
                        </Stack>
                      </Paper>
                    </Box>

                    <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                      🎯 Haz tus predicciones:
                    </Typography>
                    <Stack spacing={2}>
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
                        <Chip
                          label={activeDrag}
                          color="primary"
                          sx={{
                            fontSize: '1rem',
                            py: 2.5,
                            px: 1,
                            cursor: 'grabbing',
                            opacity: 0.9,
                          }}
                        />
                      ) : null}
                    </DragOverlay>

                    <Box mt={3} textAlign="center">
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={loading || !isOnline}
                        sx={{ px: 6, py: 1.5 }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Guardar Predicciones'}
                      </Button>
                    </Box>
                  </DndContext>
                )}
              </Box>
            ) : !loading ? (
              <Box textAlign="center">
                <Alert severity="success" sx={{ mb: 3 }}>
                  ¡Tus predicciones han sido guardadas! Puedes modificarlas hasta el 24 de diciembre.
                </Alert>
                <Button variant="outlined" onClick={handleReset}>
                  Modificar mis predicciones
                </Button>
              </Box>
            ) : null}

            {submittedCount > 0 && (
              <Box mt={4}>
                <Typography variant="h6" gutterBottom color="primary">
                  Han participado: {submittedCount} de {PARTICIPANTS.length}
                </Typography>
              </Box>
            )}

            <Box mt={4}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Visibility />}
                fullWidth
                size="large"
                onClick={handleShowResults}
                disabled={loading || !isOnline}
              >
                {loading ? <CircularProgress size={24} /> : `${showResults ? 'Ocultar' : 'Ver'} Todas las Predicciones`}
              </Button>

              {showResults && canReveal && (
                <Box mt={3}>
                  {allPredictions.map((userPred) => (
                    <Card key={userPred.userName} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Predicciones de {userPred.userName}
                        </Typography>
                        <Stack spacing={1}>
                          {Object.entries(userPred.predictions).map(([person, prediction]) => (
                            <Typography variant="body2" key={person}>
                              <strong>{person}:</strong> {prediction}
                            </Typography>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
              {showResults && !canReveal && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  Los resultados se revelarán el 24 de diciembre
                </Alert>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

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
    </ThemeProvider>
  )
}

export default App
