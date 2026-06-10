import { Link } from 'react-router-dom'

export default function ListingSubmitted() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🐢</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">İlanınız Alındı!</h2>
        <p className="text-gray-500 mb-2">
          İlanınız ekibimiz tarafından inceleniyor.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Onaylandıktan sonra ana sayfada yayına girecek. Bu işlem genellikle birkaç saat sürer.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/">
            <button className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition">
              Ana Sayfaya Dön
            </button>
          </Link>
          <Link to="/create-listing">
            <button className="w-full bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition">
              Başka İlan Ver
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}