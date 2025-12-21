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
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { api } from './api'
import type { ScoreboardEntry } from './api'

const QUIZ_QUESTIONS = [
  { id: 'q1', question: '¿Cuál es el país más poblado del mundo?' },
  { id: 'q2', question: '¿En qué año cayó el Muro de Berlín?' },
  { id: 'q3', question: '¿Cuál es el océano más grande?' },
]

const PARTICIPANTS = ['Miriam', 'Paula', 'Adriana', 'Lula', 'Diego', 'Carlos A', 'Padrino']

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

  // Quiz answers
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({
    q1: '',
    q2: '',
    q3: '',
  })

  // Prediction answers
  const [predictionAnswers, setPredictionAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    loadScoreboard()
  }, [])

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
            {QUIZ_QUESTIONS.map((q) => (
              <TextField
                key={q.id}
                label={q.question}
                value={quizAnswers[q.id]}
                onChange={(e) => handleQuizAnswerChange(q.id, e.target.value)}
                fullWidth
              />
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
          <Typography variant="body2" gutterBottom>
            Select who each person gave the gift to (the receiver).
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PARTICIPANTS.map((giver) => (
              <FormControl key={giver} fullWidth>
                <InputLabel>{giver} gave to</InputLabel>
                <Select
                  value={predictionAnswers[giver] || ''}
                  onChange={(e) => handlePredictionAnswerChange(giver, e.target.value)}
                  label={`${giver} gave to`}
                >
                  <MenuItem value="">
                    <em>Select recipient</em>
                  </MenuItem>
                  {PARTICIPANTS.filter(p => p !== giver).map((receiver) => (
                    <MenuItem key={receiver} value={receiver}>
                      {receiver}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
            <Button
              variant="contained"
              onClick={handleSubmitPredictionAnswers}
              disabled={loading || Object.keys(predictionAnswers).length !== PARTICIPANTS.length}
            >
              Save Prediction Answers
            </Button>
          </Box>
        </Paper>
      </TabPanel>
    </Container>
  )
}
