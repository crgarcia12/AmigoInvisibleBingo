import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
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
} from '@mui/material'
import { CardGiftcard, Celebration, Visibility } from '@mui/icons-material'
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

function App() {
  const [userName, setUserName] = useState('')
  const [predictions, setPredictions] = useState<Predictions>({})
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [allPredictions, setAllPredictions] = useState<UserPrediction[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('amigoInvisiblePredictions')
    if (saved) {
      setAllPredictions(JSON.parse(saved))
    }
  }, [])

  const handlePredictionChange = (person: string, prediction: string) => {
    setPredictions((prev) => ({
      ...prev,
      [person]: prediction,
    }))
  }

  const handleSubmit = () => {
    if (!userName) {
      alert('Por favor ingresa tu nombre')
      return
    }

    const incomplete = PARTICIPANTS.some((person) => !predictions[person])
    if (incomplete) {
      alert('Por favor completa todas las predicciones')
      return
    }

    const newPrediction: UserPrediction = {
      userName,
      predictions,
      timestamp: new Date().toISOString(),
    }

    const updated = [...allPredictions.filter((p) => p.userName !== userName), newPrediction]
    setAllPredictions(updated)
    localStorage.setItem('amigoInvisiblePredictions', JSON.stringify(updated))
    setSubmitted(true)
  }

  const handleReset = () => {
    setUserName('')
    setPredictions({})
    setSubmitted(false)
  }

  const canReveal = new Date() >= REVEAL_DATE || showResults

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={6}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
            }}
          >
            <Box textAlign="center" mb={4}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={2}>
                <CardGiftcard sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight="bold" color="primary">
                  🎄 Bingo del Amigo Invisible 🎁
                </Typography>
                <Celebration sx={{ fontSize: 48, color: 'secondary.main' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ¿Quién es el amigo invisible de quién?
              </Typography>
              <Chip
                label={`Revelación: 24 de Diciembre ${REVEAL_DATE.getFullYear()}`}
                color="secondary"
                sx={{ mt: 1 }}
              />
            </Box>

            {!submitted ? (
              <Box>
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel>Tu Nombre</InputLabel>
                  <Select value={userName} onChange={(e) => setUserName(e.target.value)} label="Tu Nombre">
                    {PARTICIPANTS.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {userName && (
                  <>
                    <Typography variant="h5" gutterBottom color="primary" mb={3}>
                      Haz tus predicciones:
                    </Typography>
                    <Grid container spacing={2}>
                      {PARTICIPANTS.map((person) => (
                        <Grid item xs={12} sm={6} md={4} key={person}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                ¿Quién es el amigo invisible de {person}?
                              </Typography>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={predictions[person] || ''}
                                  onChange={(e) => handlePredictionChange(person, e.target.value)}
                                  displayEmpty
                                >
                                  <MenuItem value="" disabled>
                                    Selecciona...
                                  </MenuItem>
                                  {PARTICIPANTS.filter((p) => p !== person).map((name) => (
                                    <MenuItem key={name} value={name}>
                                      {name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <Box mt={4} textAlign="center">
                      <Button variant="contained" size="large" onClick={handleSubmit} sx={{ px: 6, py: 1.5 }}>
                        Guardar Predicciones
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Box textAlign="center">
                <Alert severity="success" sx={{ mb: 3 }}>
                  ¡Tus predicciones han sido guardadas! Vuelve el 24 de diciembre para ver los resultados.
                </Alert>
                <Button variant="outlined" onClick={handleReset}>
                  Hacer nuevas predicciones
                </Button>
              </Box>
            )}

            {allPredictions.length > 0 && (
              <Box mt={4}>
                <Typography variant="h5" gutterBottom color="primary">
                  Participantes: {allPredictions.length}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {allPredictions.map((pred) => (
                    <Chip key={pred.userName} label={pred.userName} color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {canReveal && (
              <Box mt={4}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Visibility />}
                  fullWidth
                  size="large"
                  onClick={() => setShowResults(!showResults)}
                >
                  {showResults ? 'Ocultar' : 'Ver'} Todas las Predicciones
                </Button>

                {showResults && (
                  <Box mt={3}>
                    {allPredictions.map((userPred) => (
                      <Card key={userPred.userName} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            Predicciones de {userPred.userName}
                          </Typography>
                          <Grid container spacing={1}>
                            {Object.entries(userPred.predictions).map(([person, prediction]) => (
                              <Grid item xs={12} sm={6} key={person}>
                                <Typography variant="body2">
                                  <strong>{person}:</strong> {prediction}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
