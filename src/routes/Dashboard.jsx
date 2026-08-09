import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Angemeldet als {user?.email}</p>
      <button type="button" onClick={() => signOut(auth)}>
        Abmelden
      </button>
    </div>
  )
}
