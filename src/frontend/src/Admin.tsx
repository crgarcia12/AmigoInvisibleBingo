import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material'
import { Clear } from '@mui/icons-material'
import { api } from './api'
import type { ScoreboardEntry, AdminQuizQuestion } from './api'
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

const PARTICIPANTS = ['Miriam', 'Paula', 'Adriana', 'Lula', 'Diego', 'Carlos A', 'Padrino']

function DraggableName({ name, isUsed }: { name: string; isUsed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `admin-draggable-${name}`,
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
    id: `admin-droppable-${person}`,
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
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, minWidth: 80, color: '#333' }}>
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

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Admin() {
  const [tabValue, setTabValue] = useState(0)
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([])
  const [hasAdminAnswers, setHasAdminAnswers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<AdminQuizQuestion[]>([])
  const [activeDrag, setActiveDrag] = useState<string | null>(null)

  // Quiz answers
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})

  // Prediction answers
  const [predictionAnswers, setPredictionAnswers] = useState<Record<string, string>>({})

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
    loadScoreboard()
    loadQuizQuestions()
  }, [])

  const loadQuizQuestions = async () => {
    try {
      const questions = await api.getAdminQuizQuestions()
      setQuizQuestions(questions)
      
      // Initialize quiz answers with correct answers
      const initialAnswers: Record<string, string> = {}
      questions.forEach(q => {
        initialAnswers[q.id] = q.correctAnswer
      })
      setQuizAnswers(initialAnswers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz questions')
    }
  }

  const loadScoreboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getScoreboard()
      setScoreboard(response.data)
      setHasAdminAnswers(response.hasAdminAnswers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scoreboard')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizAnswerChange = (questionId: string, value: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handlePredictionAnswerChange = (giver: string, value: string) => {
    setPredictionAnswers((prev) => ({ ...prev, [giver]: value }))
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
        setPredictionAnswers((prev) => ({
          ...prev,
          [targetPerson]: draggedName,
        }))
      }
    }
  }

  const handleRemovePrediction = (person: string) => {
    setPredictionAnswers((prev) => {
      const newPredictions = { ...prev }
      delete newPredictions[person]
      return newPredictions
    })
  }

  const handleSubmitQuizAnswers = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.setQuizCorrectAnswers(quizAnswers)
      setSuccess('Quiz correct answers saved successfully!')
      await loadScoreboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz answers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPredictionAnswers = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.setCorrectAnswers(predictionAnswers)
      setSuccess('Prediction correct answers saved successfully!')
      await loadScoreboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prediction answers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Scoreboard" />
        <Tab label="Set Quiz Answers" />
        <Tab label="Set Prediction Answers" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Scoreboard
          </Typography>
          {!hasAdminAnswers && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Correct answers not set yet. Set them in the other tabs to calculate scores.
            </Alert>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Rank</strong></TableCell>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell align="center"><strong>Quiz</strong></TableCell>
                  <TableCell align="center"><strong>Predictions</strong></TableCell>
                  <TableCell align="center"><strong>Total</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scoreboard.map((entry, index) => (
                  <TableRow key={entry.userName}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell align="center">
                      {entry.quizCorrect}/{entry.quizTotal}
                    </TableCell>
                    <TableCell align="center">
                      {entry.predictionsCorrect}/{entry.predictionsTotal}
                    </TableCell>
                    <TableCell align="center">
                      {entry.totalCorrect}/{entry.totalQuestions}
                    </TableCell>
                    <TableCell align="center">
                      <strong>{entry.score}%</strong>
                    </TableCell>
                  </TableRow>
                ))}
                {scoreboard.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Set Quiz Correct Answers
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {quizQuestions.map((q) => (
              <FormControl key={q.id} fullWidth>
                <InputLabel>{q.question}</InputLabel>
                <Select
                  value={quizAnswers[q.id] || ''}
                  onChange={(e) => handleQuizAnswerChange(q.id, e.target.value)}
                  label={q.question}
                >
                  {q.options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
            <Button
              variant="contained"
              onClick={handleSubmitQuizAnswers}
              disabled={loading || Object.values(quizAnswers).some((v) => !v)}
            >
              Save Quiz Answers
            </Button>
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Set Prediction Correct Answers
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            Arrastra los nombres para indicar quién fue el amigo invisible de cada persona.
          </Typography>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                Nombres disponibles:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {PARTICIPANTS.map((name) => {
                  const isUsed = Object.values(predictionAnswers).includes(name)
                  return <DraggableName key={name} name={name} isUsed={isUsed} />
                })}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {PARTICIPANTS.map((person) => (
                <DropZone
                  key={person}
                  person={person}
                  prediction={predictionAnswers[person] || ''}
                  onRemove={() => handleRemovePrediction(person)}
                />
              ))}
            </Box>

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
                    cursor: 'grabbing',
                  }}
                >
                  {activeDrag}
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>

          <Button
            variant="contained"
            onClick={handleSubmitPredictionAnswers}
            disabled={loading || Object.keys(predictionAnswers).length !== PARTICIPANTS.length}
          >
            Save Prediction Answers
          </Button>
        </Paper>
      </TabPanel>
    </Container>
  )
}
