import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Editor from './pages/editorPage'
import './App.css'
function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/editor" element={<Editor/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
