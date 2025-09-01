const Index = () => {
  // This component should not be reached since AuthGuard handles all redirects
  // But if it is reached, show a simple landing page or loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p className="text-gray-600">Redirecting you to the appropriate dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
