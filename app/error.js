'use client'
export default function ErrorPage({ reset }) {
  return <main role="alert" className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="text-3xl font-bold">Something went wrong</h1><p className="mt-4 text-slate-600">We couldn’t display this page. If you were saving a request, check your account before submitting it again.</p><button onClick={reset} className="mt-8 rounded-lg bg-slate-900 px-6 py-3 text-white">Try loading again</button><a href="/" className="block mt-5 underline">Return home</a></main>
}
