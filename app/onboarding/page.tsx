import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('auth-token')

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Complete your onboarding
        </h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">
            Welcome to Vanta! Please complete the following steps to get started:
          </p>
          <ol className="mt-6 space-y-4">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">1</span>
              <span className="ml-4 text-gray-700">Create your organization profile</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">2</span>
              <span className="ml-4 text-gray-700">Connect your bank account</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">3</span>
              <span className="ml-4 text-gray-700">Upload your first documents</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
