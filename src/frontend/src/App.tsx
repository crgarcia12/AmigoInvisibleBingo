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
import { Visibility, Clear, CloudOff } from '@mui/icons-material'
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
      await api.submitPredictions(userName, predictions)
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

                {userName && (
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
              </Box>
            ) : !loading ? (
              <Box textAlign="center">
                <Alert severity="success" sx={{ mb: 2, py: 0.5 }}>
                  ✅ Guardado
                </Alert>
                <Button variant="outlined" size="small" onClick={handleReset}>
                  Modificar
                </Button>
              </Box>
            ) : null}

            {submittedCount > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  Participantes: {submittedCount}/{PARTICIPANTS.length}
                </Typography>
              </Box>
            )}

            <Box mt={2}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Visibility />}
                fullWidth
                size="small"
                onClick={handleShowResults}
                disabled={loading || !isOnline}
              >
                {loading ? <CircularProgress size={20} /> : `${showResults ? 'Ocultar' : 'Ver'} Resultados`}
              </Button>

              {showResults && canReveal && (
                <Box mt={2}>
                  {allPredictions.map((userPred) => (
                    <Card key={userPred.userName} sx={{ mb: 1.5, p: 1.5 }}>
                      <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {userPred.userName}
                      </Typography>
                      <Stack spacing={0.5}>
                        {Object.entries(userPred.predictions).map(([person, prediction]) => (
                          <Typography variant="caption" key={person} sx={{ fontSize: '0.8rem' }}>
                            {person} → {prediction}
                          </Typography>
                        ))}
                      </Stack>
                    </Card>
                  ))}
                </Box>
              )}
              {showResults && !canReveal && (
                <Alert severity="info" sx={{ mt: 2, py: 0.5, fontSize: '0.8rem' }}>
                  Resultados el 24 de diciembre
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
