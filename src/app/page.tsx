import Link from "next/link";
import TopButton from "@/components/common/TopButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <TopButton />
      
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="bg-purple-600 -m-6 mb-6 rounded-t-lg px-6 py-4">
            <h1 className="text-2xl font-bold text-white text-center">
              夢殿受付管理システム
            </h1>
          </div>
          
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">
              旅館夢殿の予約受付管理システム
            </p>
            <p className="text-gray-600">
              温泉寺夢殿様、YumeChanBotへようこそ。
            </p>
          </div>
        </div>

        {/* 機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link href="/admin" className="feature-card">
            <div className="text-center">
              <div className="feature-card-icon">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="feature-card-title">
                受付管理
              </h2>
              <p className="feature-card-description">
                予約情報の確認、メール送信、ステータス管理を行います
              </p>
              <div className="feature-card-action">
                管理画面へ移動
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/form" className="feature-card">
            <div className="text-center">
              <div className="feature-card-icon">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="feature-card-title">
                ゲストフォーム
              </h2>
              <p className="feature-card-description">
                ゲストが予約情報を入力・確認するフォーム画面
              </p>
              <div className="feature-card-action">
                フォームへ移動
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="feature-card">
            <div className="text-center">
              <div className="feature-card-icon">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="feature-card-title">
                統計・レポート
              </h2>
              <p className="feature-card-description">
                予約状況の統計やレポート機能（開発予定）
              </p>
              <div className="feature-card-action">
                レポートを表示
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* フッター */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          お困りの際は、画面右下のサポート連絡先までお問い合わせください。
        </div>
      </div>

      {/* サポートボタン */}
      <div className="fixed bottom-6 right-6 z-40">
        <button className="bg-gray-600 hover:bg-gray-700 text-white w-12 h-12 rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}