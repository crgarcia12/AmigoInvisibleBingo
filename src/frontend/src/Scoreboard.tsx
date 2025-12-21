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
  Alert,
  CircularProgress,
  Button,
} from '@mui/material'
import { api } from './api'
import type { ScoreboardEntry } from './api'

interface ScoreboardProps {
  onBack: () => void
}

export default function Scoreboard({ onBack }: ScoreboardProps) {
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAdminAnswers, setHasAdminAnswers] = useState(false)

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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!hasAdminAnswers) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Las respuestas correctas aún no han sido publicadas por el administrador.
        </Alert>
        <Button variant="outlined" onClick={onBack}>
          Volver
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#d32f2f' }}>
          🏆 Tabla de Posiciones
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resultados finales - ¡Felicitaciones a todos!
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Predictions Only Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#388e3c' }}>
          🎯 Predicciones del Amigo Invisible
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Pos</strong></TableCell>
                <TableCell><strong>Usuario</strong></TableCell>
                <TableCell align="center"><strong>Correctas</strong></TableCell>
                <TableCell align="center"><strong>Total</strong></TableCell>
                <TableCell align="center"><strong>Puntos</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...scoreboard]
                .sort((a, b) => b.predictionsCorrect - a.predictionsCorrect)
                .map((entry, index) => (
                  <TableRow 
                    key={entry.userName}
                    sx={{
                      bgcolor: index === 0 ? '#fff9c4' : index === 1 ? '#f5f5f5' : index === 2 ? '#ffe0b2' : 'transparent',
                      '&:hover': { bgcolor: '#e3f2fd' }
                    }}
                  >
                    <TableCell>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: index < 3 ? 600 : 400 }}>
                      {entry.userName}
                    </TableCell>
                    <TableCell align="center">
                      <strong>{entry.predictionsCorrect}</strong>
                    </TableCell>
                    <TableCell align="center">
                      {entry.predictionsTotal}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: index === 0 ? '#fdd835' : index < 3 ? '#388e3c' : '#757575',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      >
                        {entry.predictionsCorrect}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Full Scoreboard Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#d32f2f' }}>
          🎄 Puntuación Total (Predicciones + Quiz)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Pos</strong></TableCell>
                <TableCell><strong>Usuario</strong></TableCell>
                <TableCell align="center"><strong>Quiz</strong></TableCell>
                <TableCell align="center"><strong>Predicciones</strong></TableCell>
                <TableCell align="center"><strong>Total</strong></TableCell>
                <TableCell align="center"><strong>%</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scoreboard.map((entry, index) => (
                <TableRow 
                  key={entry.userName}
                  sx={{
                    bgcolor: index === 0 ? '#fff9c4' : index === 1 ? '#f5f5f5' : index === 2 ? '#ffe0b2' : 'transparent',
                    '&:hover': { bgcolor: '#e3f2fd' }
                  }}
                >
                  <TableCell>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: index < 3 ? 600 : 400 }}>
                    {entry.userName}
                  </TableCell>
                  <TableCell align="center">
                    {entry.quizCorrect}/{entry.quizTotal}
                  </TableCell>
                  <TableCell align="center">
                    {entry.predictionsCorrect}/{entry.predictionsTotal}
                  </TableCell>
                  <TableCell align="center">
                    <strong>{entry.totalCorrect}/{entry.totalQuestions}</strong>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: index === 0 ? '#fdd835' : index < 3 ? '#d32f2f' : '#757575',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      {entry.score.toFixed(1)}%
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box textAlign="center">
        <Button variant="outlined" onClick={onBack}>
          Volver
        </Button>
      </Box>
    </Container>
  )
}
