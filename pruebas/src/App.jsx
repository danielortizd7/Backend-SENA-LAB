import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import RegistroMuestras from './components/RegistroMuestras'

function App() {
  return (
    <Router>
      <div>
        <RegistroMuestras />
      </div>
    </Router>
  )
}

export default App 