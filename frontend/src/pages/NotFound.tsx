import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-6xl font-bold font-heading text-gradient">404</h1>
        <p className="text-xl text-muted-foreground mt-2">Page not found</p>
        <p className="text-sm text-muted-foreground mt-1">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="mt-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
