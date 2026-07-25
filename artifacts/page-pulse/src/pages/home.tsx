import { useState } from "react"
import { Activity, Zap, FileText, AlignLeft, Heading1, Image as ImageIcon, BookOpen, Search, ArrowRight, ShieldAlert, Globe, ServerCrash } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAnalyzeUrl } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { CountUp } from "@/components/count-up"
import { cn } from "@/lib/utils"

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const getStatusVariant = (status: number) => {
  if (status >= 200 && status < 300) return "success"
  if (status >= 300 && status < 400) return "warning"
  return "error"
}

export default function Home() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const analyzeMutation = useAnalyzeUrl()
  
  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }
    
    let formattedUrl = url.trim()
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl
    }
    
    if (!isValidUrl(formattedUrl)) {
      setError("Please enter a valid HTTP or HTTPS URL")
      return
    }
    
    setUrl(formattedUrl) // update with formatting
    setError("")
    
    analyzeMutation.mutate({ data: { url: formattedUrl } })
  }
  
  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden font-sans bg-background selection:bg-primary/20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] -z-20 pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3 text-primary group select-none">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 transition-all group-hover:scale-105 group-hover:bg-primary/20">
            <Activity className="w-5 h-5 text-primary" />
            <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] opacity-50 animate-pulse"></div>
          </div>
          <span className="font-mono font-bold text-xl tracking-tight text-foreground">Page Pulse</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col z-10">
        {/* Hero & Input */}
        <div className="max-w-2xl mx-auto w-full text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              X-Ray your <span className="text-primary relative inline-block">URL<div className="absolute bottom-1 left-0 w-full h-2 md:h-3 bg-primary/20 -z-10"></div></span>
            </h1>
            <p className="text-lg text-muted-foreground font-mono">
              Instantly analyze HTTP status, tags, and page metrics.
            </p>
          </div>
          
          <form onSubmit={handleAnalyze} className="relative w-full group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col md:flex-row gap-3 bg-card p-2 rounded-xl border border-border shadow-lg">
              <div className="relative flex-1 flex items-center">
                <Globe className="absolute left-4 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="example.com"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    if (error) setError("")
                  }}
                  className="pl-12 h-14 bg-transparent border-none shadow-none text-base md:text-lg font-mono focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-14 px-8 rounded-lg font-mono tracking-wide w-full md:w-auto overflow-hidden relative transition-all active:scale-[0.98]"
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5 animate-pulse" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Analyze <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -bottom-7 left-2 text-sm font-medium text-destructive flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" /> {error}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Dynamic States */}
        <div className="w-full min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* Initial Empty State */}
            {!analyzeMutation.isPending && !analyzeMutation.data && !analyzeMutation.isError && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center opacity-50 h-full"
              >
                <div className="w-16 h-16 rounded-2xl border border-dashed border-muted-foreground flex items-center justify-center mb-4 bg-muted/20">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-mono text-muted-foreground text-sm">Ready to scan target URL</p>
              </motion.div>
            )}

            {/* Loading State */}
            {analyzeMutation.isPending && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {[...Array(7)].map((_, i) => (
                  <Card key={i} className={cn("overflow-hidden border-border/50 h-[140px]", 
                    i === 4 || i === 5 ? "sm:col-span-2 lg:col-span-2" : "",
                    i === 6 ? "sm:col-span-2 lg:col-span-4" : ""
                  )}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                      <div className="h-8 w-8 rounded-md bg-muted animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 w-20 bg-muted rounded animate-pulse mt-1 mb-2"></div>
                      <div className="h-2 w-1/2 bg-muted/50 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Error State */}
            {analyzeMutation.isError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-xl mx-auto w-full py-8"
              >
                <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
                  <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                      <ServerCrash className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Analysis Failed</h3>
                      <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
                        {analyzeMutation.error?.data?.error || "We couldn't reach that URL or an unexpected error occurred."}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => analyzeMutation.mutate({ data: { url } })}
                      className="mt-6 border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Success State */}
            {analyzeMutation.isSuccess && analyzeMutation.data && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-12"
              >
                {/* 1. Status */}
                <ResultCard
                  index={0}
                  title="HTTP Status"
                  icon={<Activity className="w-4 h-4 text-muted-foreground" />}
                  value={
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-mono font-bold tracking-tighter">{analyzeMutation.data.status}</span>
                      <Badge variant={getStatusVariant(analyzeMutation.data.status) as any} className="text-xs font-mono uppercase tracking-widest">
                        {analyzeMutation.data.status < 300 ? "OK" : analyzeMutation.data.status < 400 ? "Redirect" : "Error"}
                      </Badge>
                    </div>
                  }
                />
                
                {/* 2. Response Time */}
                <ResultCard
                  index={1}
                  title="Response Time"
                  icon={<Zap className="w-4 h-4 text-muted-foreground" />}
                  value={
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-mono font-bold tracking-tighter">
                        <CountUp value={parseInt(analyzeMutation.data.responseTime.replace(/\D/g, '')) || 0} duration={1} />
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">ms</span>
                    </div>
                  }
                />

                {/* 5. H1 Count */}
                <ResultCard
                  index={2}
                  title="H1 Tags"
                  icon={<Heading1 className="w-4 h-4 text-muted-foreground" />}
                  value={
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-mono font-bold tracking-tighter">
                        <CountUp value={analyzeMutation.data.h1Count} duration={1} />
                      </span>
                      {analyzeMutation.data.h1Count !== 1 && (
                        <Badge variant="warning" className="text-[10px] uppercase font-mono tracking-wider">Ideal: 1</Badge>
                      )}
                    </div>
                  }
                />

                {/* 7. Word Count */}
                <ResultCard
                  index={3}
                  title="Word Count"
                  icon={<BookOpen className="w-4 h-4 text-muted-foreground" />}
                  value={
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-mono font-bold tracking-tighter">
                        <CountUp value={analyzeMutation.data.wordCount} duration={1.5} />
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">words</span>
                    </div>
                  }
                />

                {/* 3. Page Title */}
                <ResultCard
                  index={4}
                  className="sm:col-span-2 lg:col-span-2"
                  title="Page Title"
                  icon={<FileText className="w-4 h-4 text-muted-foreground" />}
                  value={
                    <div className="text-xl font-medium leading-snug break-words">
                      {analyzeMutation.data.title || <span className="text-muted-foreground italic">No title found</span>}
                    </div>
                  }
                />

                {/* 4. Meta Description */}
                <ResultCard
                  index={5}
                  className="sm:col-span-2 lg:col-span-2"
                  title="Meta Description"
                  icon={<AlignLeft className="w-4 h-4 text-muted-foreground" />}
                  value={
                    analyzeMutation.data.metaDescription && analyzeMutation.data.metaDescription.length > 120 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-base text-muted-foreground line-clamp-3 text-left cursor-help border-b border-dashed border-muted-foreground/30 pb-0.5 inline-block hover:text-foreground transition-colors">
                            {analyzeMutation.data.metaDescription}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-[calc(100vw-2rem)] sm:max-w-md p-3 text-sm leading-relaxed shadow-2xl border-primary/20">
                          <p>{analyzeMutation.data.metaDescription}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="text-base text-muted-foreground line-clamp-3">
                        {analyzeMutation.data.metaDescription || <span className="italic">No description provided</span>}
                      </div>
                    )
                  }
                />

                {/* 6. Missing Alt Images */}
                <ResultCard
                  index={6}
                  className="sm:col-span-2 lg:col-span-4"
                  title="Images Missing Alt Text"
                  icon={<ImageIcon className="w-4 h-4 text-muted-foreground" />}
                  value={
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-mono font-bold tracking-tighter">
                        <CountUp value={analyzeMutation.data.missingAltImages} duration={1} />
                      </span>
                      {analyzeMutation.data.missingAltImages > 0 && (
                        <Badge variant="error" className="text-xs uppercase font-mono tracking-widest">SEO Warning</Badge>
                      )}
                      {analyzeMutation.data.missingAltImages === 0 && (
                        <Badge variant="success" className="text-xs uppercase font-mono tracking-widest">Perfect</Badge>
                      )}
                    </div>
                  }
                />
                
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto p-6 flex justify-center mt-auto z-10 border-t border-border/40">
        <a 
          href="https://digitalheroesco.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-mono group py-2"
        >
          Built for Digital Heroes Training Task
          <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        </a>
      </footer>
    </div>
  )
}

function ResultCard({ index, title, icon, value, className }: { index: number, title: string, icon: React.ReactNode, value: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={cn("h-full min-h-[140px]", className)}
    >
      <Card className="h-full hover:border-primary/40 hover:shadow-lg transition-all duration-300 group bg-card/60 backdrop-blur-md flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">{title}</CardTitle>
          <div className="p-2 bg-muted/40 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors text-muted-foreground">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          {value}
        </CardContent>
      </Card>
    </motion.div>
  )
}
