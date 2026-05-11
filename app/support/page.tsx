export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          JBC Launchgate Support
        </h1>

        <p className="text-gray-300 text-lg leading-8 mb-8">
          Welcome to the official support center for JBC Launchgate.
          If you are experiencing technical issues, account access problems,
          notification issues, or security concerns, our support team is here
          to assist you.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Contact Support
          </h2>

          <p className="text-gray-300 mb-3">
            Email us directly:
          </p>

          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=support@jimmyboss.com"
            className="text-green-400 hover:text-green-300 text-lg font-medium break-all"
          >
            support@jimmyboss.com
          </a>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            When Contacting Support
          </h2>

          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Your Protocol ID (if applicable)</li>
            <li>Device model</li>
            <li>iOS version</li>
            <li>A brief description of the issue</li>
          </ul>
        </div>

        <div className="bg-red-950/40 border border-red-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-red-400">
            Security Notice
          </h2>

          <p className="text-gray-300 leading-7">
            JBC Launchgate will never ask for your wallet private keys,
            recovery phrases, or passwords through email. Only communicate
            through official JBC channels.
          </p>
        </div>

        <footer className="mt-12 text-gray-500 text-sm">
          © 2026 JBC Launchgate. All rights reserved.
        </footer>
      </div>
    </main>
  );
}