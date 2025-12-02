export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-6"></div>
        <p className="text-lg text-foreground font-medium">Carregando...</p>
      </div>
    </div>
  );
}
