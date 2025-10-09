'use client';

import { useState } from 'react';

type ReservationData = {
  bookingId: string;
  guestName: string;
  email: string;
  checkinDate: string;
  nights: number;
  otaName: string;
  dinnerIncluded: 'Yes' | 'No' | 'Unknown';
};

type Language = 'ja' | 'en';

type FormData = {
  language: Language;
  reservationConfirmed: boolean;
  hasChildren: boolean;
  childrenDetails: string;
  arrivalCountryDate: string;
  prevNightPlace: string;
  hasPhone: boolean;
  phoneNumber: string;
  dinnerRequest: 'yes' | 'no' | '';
  dinnerConsent: boolean;
  dietaryNeeds: boolean;
  dietaryDetails: string;
  arrivalTime: string;
  arrivalTimeConsent: boolean;
  otherNotes: string;
};

const i18n = {
  ja: {
    title: 'ご予約情報確認フォーム',
    selectLanguage: '言語を選択してください',
    reservationDetails: 'ご予約内容',
    bookingId: '予約ID',
    guestName: 'お名前',
    email: 'メールアドレス',
    checkinDate: 'チェックイン日',
    nights: '泊数',
    otaName: '予約サイト',
    dinnerIncluded: '夕食',
    confirmReservation: 'この内容で間違いありませんか？',
    yes: 'はい',
    no: 'いいえ（修正が必要）',
    next: '次へ',
    back: '戻る',
    submit: '送信',
    hasChildren: 'お子様連れですか？',
    childrenDetails: 'お子様の年齢と性別を教えてください',
    arrivalCountryDate: '日本への到着日を教えてください',
    prevNightPlace: 'チェックイン前日の宿泊場所を教えてください',
    hasPhone: '日本国内で使える携帯電話をお持ちですか？',
    phoneNumber: '電話番号を入力してください',
    dinnerRequest: '夕食を追加しますか？（1名24,000円）',
    dinnerNotice: '【夕食に関する重要なお知らせ】\n\n夕食付きプランの方へ：\n• 17時以降のご到着の場合、夕食の提供ができません。\n• 衛生法上、作り置きができないため、ご予約済みでも廃棄することになります。\n• その場合でも料金はいただきますのでご了承ください。\n• できる限り17時までにご到着ください。\n\n夕食を追加される方へ：\n• 追加料金：1名様24,000円（当日お支払い）\n• 夕食の準備のため、当日の追加はできません。1週間前までにご予約ください。\n• 追加希望の方も17時までのご到着をお願いします。\n\n食事内容について：\n• 海鮮を多く使った日本料理（懐石コース）です。\n• メニューは料理長におまかせとなります。お客様による指定はできません。\n• 重度の食物アレルギーや魚介類が食べられない方には、夕食・朝食ともに提供できません。命に関わるアレルギーをお持ちの方は、安全上の理由からお食事を提供できませんのでご了承ください。',
    dinnerConsent: '上記の夕食に関する注意事項を読み、同意します',
    dietaryNeeds: '食事に関する特別な配慮が必要ですか？（ベジタリアン/ヴィーガン/ハラル等）',
    dietaryDetails: '詳細を教えてください',
    arrivalTime: '到着予定時刻を教えてください',
    arrivalTimeNotice: '【到着時刻に関する重要なお願い】\n\n当館では、皆様に最高のお食事体験をお届けするため、お食事は全て当日調理いたしております。\n\n夕食付きプランのお客様へ：\n• ご夕食は17時を目安にご準備させていただきます。\n• 17時以降にご到着された場合、衛生法により作り置きができないため、ご夕食の提供ができかねます。\n• 食材の仕入れや仕込みは既に完了しておりますため、遅延による返金は承りかねます。\n• お客様の安全とお食事の品質を守るための規定でございますので、何卒ご理解賜りますようお願い申し上げます。\n• できる限り17時までのご到着をお願いいたします。',
    arrivalTimeConsent: '到着時刻に関する注意事項を読み、同意します',
    otherNotes: 'その他ご要望',
    thankYou: 'ご回答ありがとうございました！',
    submitting: '送信中...',
  },
  en: {
    title: 'Reservation Confirmation Form',
    selectLanguage: 'Please select your language',
    reservationDetails: 'Your Reservation',
    bookingId: 'Booking ID',
    guestName: 'Guest Name',
    email: 'Email',
    checkinDate: 'Check-in Date',
    nights: 'Nights',
    otaName: 'Booking Site',
    dinnerIncluded: 'Dinner',
    confirmReservation: 'Is this information correct?',
    yes: 'Yes',
    no: 'No (needs correction)',
    next: 'Next',
    back: 'Back',
    submit: 'Submit',
    hasChildren: 'Are you traveling with children?',
    childrenDetails: 'Please provide their age and gender',
    arrivalCountryDate: 'When will you arrive in Japan?',
    prevNightPlace: 'Where will you stay the night before check-in?',
    hasPhone: 'Do you have a cellular phone usable in Japan?',
    phoneNumber: 'Please enter your phone number',
    dinnerRequest: 'Would you like to add dinner? (24,000 JPY per person)',
    dinnerNotice: '【Important Information About Dinner】\n\nFor guests with dinner included:\n• If you arrive after 5:00 PM, we cannot provide dinner.\n• Due to hygiene regulations, we cannot prepare meals in advance. The dinner will be discarded even if you have booked it.\n• In this case, you will still be charged for the dinner. Please understand.\n• We hope you arrive by 5:00 PM at the latest.\n\nFor guests adding dinner:\n• Additional fee: 24,000 JPY per person (payable on check-in)\n• We cannot accept same-day dinner additions. Please book at least one week in advance.\n• Guests adding dinner should also arrive by 5:00 PM.\n\nAbout the dinner menu:\n• Japanese Kaiseki course featuring seafood.\n• The menu is at the chef\'s discretion. Guests cannot specify the menu.\n• We cannot provide meals (both dinner and breakfast) to guests with serious food allergies or who cannot eat seafood. If you have life-threatening allergies, we cannot provide meals for safety reasons. Please understand.',
    dinnerConsent: 'I have read and agree to the above dinner terms',
    dietaryNeeds: 'Do you have special dietary requirements? (Vegetarian/Vegan/Halal, etc.)',
    dietaryDetails: 'Please specify',
    arrivalTime: 'What time will you arrive?',
    arrivalTimeNotice: '【Important Notice Regarding Arrival Time】\n\nAt our inn, we prepare all meals fresh on the day to provide you with the finest dining experience.\n\nFor guests with dinner included:\n• We prepare dinner with an arrival time of 5:00 PM in mind.\n• If you arrive after 5:00 PM, we regret that we cannot serve dinner due to hygiene regulations that prohibit keeping prepared food.\n• As ingredients have already been procured and prepared, we are unable to offer refunds for late arrivals.\n• This policy exists to ensure your safety and maintain the quality of our cuisine. We appreciate your understanding.\n• We kindly request that you arrive by 5:00 PM whenever possible.',
    arrivalTimeConsent: 'I have read and agree to the arrival time notice',
    otherNotes: 'Other requests',
    thankYou: 'Thank you for your response!',
    submitting: 'Submitting...',
  },
};

export default function GuestForm({ reservation }: { reservation: ReservationData }) {
  const [step, setStep] = useState<'language' | 'confirm' | 'questions' | 'complete'>('language');
  const [formData, setFormData] = useState<FormData>({
    language: 'en',
    reservationConfirmed: false,
    hasChildren: false,
    childrenDetails: '',
    arrivalCountryDate: '',
    prevNightPlace: '',
    hasPhone: false,
    phoneNumber: '',
    dinnerRequest: '',
    dinnerConsent: false,
    dietaryNeeds: false,
    dietaryDetails: '',
    arrivalTime: '',
    arrivalTimeConsent: false,
    otherNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const t = i18n[formData.language];

  const handleLanguageSelect = (lang: Language) => {
    setFormData({ ...formData, language: lang });
    setStep('confirm');
  };

  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      setFormData({ ...formData, reservationConfirmed: true });
      setStep('questions');
    } else {
      alert('Please contact us to correct your reservation details.');
    }
  };

  const handleSubmit = async () => {
    // Validate dinner consent if dinner is included or requested
    if (reservation.dinnerIncluded === 'Yes' || formData.dinnerRequest === 'yes') {
      if (!formData.dinnerConsent) {
        alert(formData.language === 'ja' 
          ? '夕食に関する注意事項に同意してください。' 
          : 'Please agree to the dinner terms.');
        return;
      }
      // Validate arrival time consent if dinner is included or requested
      if (!formData.arrivalTimeConsent) {
        alert(formData.language === 'ja' 
          ? '到着時刻に関する注意事項に同意してください。' 
          : 'Please agree to the arrival time notice.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/.netlify/functions/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: reservation.bookingId, formData }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || 'Unknown error'}`);
      } else {
        setStep('complete');
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'language') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Select Language / 言語を選択</h1>
        <div className="flex flex-col gap-3">
          <button onClick={() => handleLanguageSelect('ja')} className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
            日本語
          </button>
          <button onClick={() => handleLanguageSelect('en')} className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
            English
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">{t.reservationDetails}</h1>
        <div className="space-y-2 text-gray-700 mb-6">
          <p><strong>{t.bookingId}:</strong> {reservation.bookingId}</p>
          <p><strong>{t.guestName}:</strong> {reservation.guestName}</p>
          <p><strong>{t.email}:</strong> {reservation.email}</p>
          <p><strong>{t.checkinDate}:</strong> {reservation.checkinDate}</p>
          <p><strong>{t.nights}:</strong> {reservation.nights}</p>
          <p><strong>{t.otaName}:</strong> {reservation.otaName}</p>
          <p><strong>{t.dinnerIncluded}:</strong> {reservation.dinnerIncluded}</p>
        </div>
        <p className="text-lg mb-4">{t.confirmReservation}</p>
        <div className="flex gap-3">
          <button onClick={() => handleConfirm(true)} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            {t.yes}
          </button>
          <button onClick={() => handleConfirm(false)} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            {t.no}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h1 className="text-2xl font-semibold mb-4">{t.title}</h1>

        {/* Children */}
        <div>
          <label className="block font-semibold mb-2">{t.hasChildren}</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormData({ ...formData, hasChildren: true })}
              className={`px-4 py-2 rounded ${formData.hasChildren ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t.yes}
            </button>
            <button
              onClick={() => setFormData({ ...formData, hasChildren: false, childrenDetails: '' })}
              className={`px-4 py-2 rounded ${!formData.hasChildren ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t.no}
            </button>
          </div>
          {formData.hasChildren && (
            <input
              type="text"
              value={formData.childrenDetails}
              onChange={(e) => setFormData({ ...formData, childrenDetails: e.target.value })}
              placeholder={t.childrenDetails}
              className="mt-2 w-full border rounded px-3 py-2"
            />
          )}
        </div>

        {/* Arrival */}
        <div>
          <label className="block font-semibold mb-2">{t.arrivalCountryDate}</label>
          <input
            type="date"
            value={formData.arrivalCountryDate}
            onChange={(e) => setFormData({ ...formData, arrivalCountryDate: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Prev night */}
        <div>
          <label className="block font-semibold mb-2">{t.prevNightPlace}</label>
          <input
            type="text"
            value={formData.prevNightPlace}
            onChange={(e) => setFormData({ ...formData, prevNightPlace: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block font-semibold mb-2">{t.hasPhone}</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormData({ ...formData, hasPhone: true })}
              className={`px-4 py-2 rounded ${formData.hasPhone ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t.yes}
            </button>
            <button
              onClick={() => setFormData({ ...formData, hasPhone: false, phoneNumber: '' })}
              className={`px-4 py-2 rounded ${!formData.hasPhone ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t.no}
            </button>
          </div>
          {formData.hasPhone && (
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder={t.phoneNumber}
              className="mt-2 w-full border rounded px-3 py-2"
            />
          )}
        </div>

        {/* Dinner request (if dinner not included) */}
        {reservation.dinnerIncluded !== 'Yes' && (
          <div>
            <label className="block font-semibold mb-2">{t.dinnerRequest}</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormData({ ...formData, dinnerRequest: 'yes' })}
                className={`px-4 py-2 rounded ${formData.dinnerRequest === 'yes' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {t.yes}
              </button>
              <button
                onClick={() => setFormData({ ...formData, dinnerRequest: 'no' })}
                className={`px-4 py-2 rounded ${formData.dinnerRequest === 'no' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {t.no}
              </button>
            </div>
          </div>
        )}

        {/* Dinner notice and consent (if dinner included or requested) */}
        {(reservation.dinnerIncluded === 'Yes' || formData.dinnerRequest === 'yes') && (
          <div className="border border-orange-300 bg-orange-50 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 mb-3 font-sans">{t.dinnerNotice}</pre>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dinnerConsent}
                onChange={(e) => setFormData({ ...formData, dinnerConsent: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm font-semibold">{t.dinnerConsent}</span>
            </label>
          </div>
        )}

        {/* Dietary needs (if dinner included or requested) */}
        {(reservation.dinnerIncluded === 'Yes' || formData.dinnerRequest === 'yes') && (
          <div>
            <label className="block font-semibold mb-2">{t.dietaryNeeds}</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormData({ ...formData, dietaryNeeds: true })}
                className={`px-4 py-2 rounded ${formData.dietaryNeeds ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {t.yes}
              </button>
              <button
                onClick={() => setFormData({ ...formData, dietaryNeeds: false, dietaryDetails: '' })}
                className={`px-4 py-2 rounded ${!formData.dietaryNeeds ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {t.no}
              </button>
            </div>
            {formData.dietaryNeeds && (
              <textarea
                value={formData.dietaryDetails}
                onChange={(e) => setFormData({ ...formData, dietaryDetails: e.target.value })}
                placeholder={t.dietaryDetails}
                className="mt-2 w-full border rounded px-3 py-2"
                rows={3}
              />
            )}
          </div>
        )}

        {/* Arrival time notice and consent (if dinner included or requested) */}
        {(reservation.dinnerIncluded === 'Yes' || formData.dinnerRequest === 'yes') && (
          <div className="border border-blue-300 bg-blue-50 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 mb-3 font-sans">{t.arrivalTimeNotice}</pre>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.arrivalTimeConsent}
                onChange={(e) => setFormData({ ...formData, arrivalTimeConsent: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm font-semibold">{t.arrivalTimeConsent}</span>
            </label>
          </div>
        )}

        {/* Arrival time */}
        <div>
          <label className="block font-semibold mb-2">{t.arrivalTime}</label>
          <input
            type="time"
            value={formData.arrivalTime}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Other notes */}
        <div>
          <label className="block font-semibold mb-2">{t.otherNotes}</label>
          <textarea
            value={formData.otherNotes}
            onChange={(e) => setFormData({ ...formData, otherNotes: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('confirm')} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            {t.back}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h1 className="text-2xl font-semibold text-green-600 mb-4">{t.thankYou}</h1>
        <p className="text-gray-600">お送りいただいた情報は受付いたしました。</p>
      </div>
    );
  }

  return null;
}

