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
  needsPickup: boolean;
  pickupConsent: boolean;
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
    no: 'いいえ',
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
    dinnerNotice: '【夕食に関する重要なお知らせ】\n\n夕食付きプランの方へ：\n• 17時以降のご到着の場合、夕食の提供ができません。\n• 衛生法上、作り置きができないため、ご予約済みでも廃棄することになります。\n• その場合でも料金はいただきますのでご了承ください。\n• 必ず17時までにご到着ください。\n\n夕食を追加される方へ：\n• 追加料金：1名様24,000円（当日お支払い）\n• 夕食の準備のため、当日の追加はできません。1週間前までにご予約ください。\n• 追加希望の方も17時までのご到着をお願いします。\n\n食事内容について：\n• 海鮮を多く使った日本料理（懐石コース）です。\n• メニューは料理長におまかせとなります。お客様による指定はできません。\n• 重度の食物アレルギーや魚介類が食べられない方には、夕食・朝食ともに提供できません。命に関わるアレルギーをお持ちの方は、安全上の理由からお食事を提供できませんのでご了承ください。',
    dinnerConsent: '上記の夕食に関する注意事項を読み、同意します',
    dietaryNeeds: '食事に関する特別な配慮が必要ですか？（ベジタリアン/ヴィーガン/ハラル等）',
    dietaryDetails: '詳細を教えてください',
    arrivalTime: '到着予定時刻を教えてください',
    arrivalTimeNotice: '【到着時刻に関する重要なお願い】\n\n当館では、皆様に最高のお食事体験をお届けするため、お食事は全て当日調理いたしております。\n\n夕食付きプランのお客様へ：\n• ご夕食は17時を目安にご準備させていただきます。\n• 17時以降にご到着された場合、衛生法により作り置きができないため、ご夕食の提供ができかねます。\n• 食材の仕入れや仕込みは既に完了しておりますため、遅延による返金は承りかねます。\n• お客様の安全とお食事の品質を守るための規定でございますので、何卒ご理解賜りますようお願い申し上げます。\n• できる限り17時までのご到着をお願いいたします。',
    arrivalTimeConsent: '到着時刻に関する注意事項を読み、同意します',
    needsPickup: 'JR河口湖駅からの送迎が必要ですか？',
    pickupNotice: '【送迎サービスについて】\n\n当館では、JR河口湖駅から12:00～17:00の間に無料送迎を行っております。\n\nJR河口湖駅に到着されましたら、必ず+81-555-72-6111までお電話ください。すぐにお迎えに上がります。\n\n温泉寺夢殿で快適にお過ごしいただけるよう、心よりお待ち申し上げております。',
    pickupConsent: '上記の送迎サービスについて読み、理解しました',
    otherNotes: 'その他ご要望',
    reviewTitle: '入力内容の確認',
    reviewMessage: '以下の内容でよろしいですか？',
    edit: '修正する',
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
    dinnerNotice: '【Important Information About Dinner】\n\nFor guests with dinner included:\n• If you arrive after 5:00 PM, we cannot provide dinner.\n• Due to hygiene regulations, we cannot prepare meals in advance. The dinner will be discarded even if you have booked it.\n• In this case, you will still be charged for the dinner. Please understand.\n• You must arrive by 5:00 PM.\n\nFor guests adding dinner:\n• Additional fee: 24,000 JPY per person (payable on check-in)\n• We cannot accept same-day dinner additions. Please book at least one week in advance.\n• Guests adding dinner should also arrive by 5:00 PM.\n\nAbout the dinner menu:\n• Japanese Kaiseki course featuring seafood.\n• The menu is at the chef\'s discretion. Guests cannot specify the menu.\n• We cannot provide meals (both dinner and breakfast) to guests with serious food allergies or who cannot eat seafood. If you have life-threatening allergies, we cannot provide meals for safety reasons. Please understand.',
    dinnerConsent: 'I have read and agree to the above dinner terms',
    dietaryNeeds: 'Do you have special dietary requirements? (Vegetarian/Vegan/Halal, etc.)',
    dietaryDetails: 'Please specify',
    arrivalTime: 'What time will you arrive?',
    arrivalTimeNotice: '【Important Notice Regarding Arrival Time】\n\nAt our inn, we prepare all meals fresh on the day to provide you with the finest dining experience.\n\nFor guests with dinner included:\n• We prepare dinner with an arrival time of 5:00 PM in mind.\n• If you arrive after 5:00 PM, we regret that we cannot serve dinner due to hygiene regulations that prohibit keeping prepared food.\n• As ingredients have already been procured and prepared, we are unable to offer refunds for late arrivals.\n• This policy exists to ensure your safety and maintain the quality of our cuisine. We appreciate your understanding.\n• We kindly request that you arrive by 5:00 PM whenever possible.',
    arrivalTimeConsent: 'I have read and agree to the arrival time notice',
    needsPickup: 'Do you need pickup service from JR Kawaguchiko Station?',
    pickupNotice: '【About Pickup Service】\n\nWe offer complimentary pickup service from JR Kawaguchiko Station between 12:00 PM and 5:00 PM.\n\nWhen you arrive at JR Kawaguchiko Station, please call +81-555-72-6111 immediately. We will come to pick you up right away.\n\nWe look forward to welcoming you to Onsenji Yumedono and ensuring your comfortable stay.',
    pickupConsent: 'I have read and understood the pickup service information',
    otherNotes: 'Other requests',
    reviewTitle: 'Review Your Responses',
    reviewMessage: 'Please confirm the information below:',
    edit: 'Edit',
    thankYou: 'Thank you for your response!',
    submitting: 'Submitting...',
  },
};

type ModalMessage = {
  type: 'error' | 'success' | 'warning';
  title: string;
  message: string;
  details?: string[];
};

type ExistingResponse = Partial<FormData> & { submittedAt?: string; isRevision?: boolean; revisedAt?: string };

export default function GuestForm({ reservation, existingResponse }: { reservation: ReservationData; existingResponse?: ExistingResponse | null }) {
  const [step, setStep] = useState<'language' | 'confirm' | 'questions' | 'review' | 'complete' | 'revision'>('language');
  const [modalMessage, setModalMessage] = useState<ModalMessage | null>(null);
  const [isRevision, setIsRevision] = useState(false);

  // Check if there's existing response
  const hasExistingResponse = existingResponse && existingResponse.submittedAt;

  const [formData, setFormData] = useState<FormData>(hasExistingResponse ? {
    language: existingResponse.language || 'en',
    reservationConfirmed: true,
    hasChildren: existingResponse.hasChildren || false,
    childrenDetails: existingResponse.childrenDetails || '',
    arrivalCountryDate: existingResponse.arrivalCountryDate || '',
    prevNightPlace: existingResponse.prevNightPlace || '',
    hasPhone: existingResponse.hasPhone || false,
    phoneNumber: existingResponse.phoneNumber || '',
    dinnerRequest: existingResponse.dinnerRequest || '',
    dinnerConsent: existingResponse.dinnerConsent || false,
    dietaryNeeds: existingResponse.dietaryNeeds || false,
    dietaryDetails: existingResponse.dietaryDetails || '',
    arrivalTime: existingResponse.arrivalTime || '',
    arrivalTimeConsent: existingResponse.arrivalTimeConsent || false,
    needsPickup: existingResponse.needsPickup || false,
    pickupConsent: existingResponse.pickupConsent || false,
    otherNotes: existingResponse.otherNotes || '',
  } : {
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
    needsPickup: false,
    pickupConsent: false,
    otherNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const t = i18n[formData.language];

  const handleLanguageSelect = (lang: Language) => {
    setFormData({ ...formData, language: lang });
    if (hasExistingResponse) {
      setStep('revision');
    } else {
      setStep('confirm');
    }
  };

  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      setFormData({ ...formData, reservationConfirmed: true });
      setStep('questions');
    } else {
      setModalMessage({
        type: 'warning',
        title: formData.language === 'ja' ? '予約内容の修正' : 'Correction Needed',
        message: formData.language === 'ja' 
          ? '予約内容に誤りがある場合は、直接ご連絡ください。' 
          : 'Please contact us directly to correct your reservation details.',
      });
    }
  };

  const handleSubmit = async () => {
    // Validate dinner consent if dinner is included or requested
    const errors: string[] = [];
    
    if (reservation.dinnerIncluded === 'Yes' || formData.dinnerRequest === 'yes') {
      if (!formData.dinnerConsent) {
        errors.push(formData.language === 'ja' 
          ? '夕食に関する注意事項に同意してください' 
          : 'Please agree to the dinner terms');
      }
      if (!formData.arrivalTimeConsent) {
        errors.push(formData.language === 'ja' 
          ? '到着時刻に関する注意事項に同意してください' 
          : 'Please agree to the arrival time notice');
      }
    }

    // Validate pickup consent if pickup is needed
    if (formData.needsPickup && !formData.pickupConsent) {
      errors.push(formData.language === 'ja' 
        ? '送迎に関する注意事項に同意してください' 
        : 'Please agree to the pickup service terms');
    }

    if (errors.length > 0) {
      setModalMessage({
        type: 'error',
        title: formData.language === 'ja' ? '入力内容を確認してください' : 'Please check your input',
        message: formData.language === 'ja' ? '以下の項目を確認してください：' : 'Please review the following:',
        details: errors,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/.netlify/functions/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: reservation.bookingId, formData, isRevision }),
      });
      if (!res.ok) {
        const err = await res.json();
        setModalMessage({
          type: 'error',
          title: formData.language === 'ja' ? '送信エラー' : 'Submission Error',
          message: err.error || 'Unknown error',
        });
      } else {
        setStep('complete');
      }
    } catch (err) {
      setModalMessage({
        type: 'error',
        title: formData.language === 'ja' ? '送信エラー' : 'Submission Error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
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

  if (step === 'revision') {
    return (
      <div className="form-card">
        <div className="form-card-header">
          {formData.language === 'ja' ? '回答済みです' : 'Already Responded'}
        </div>
        <p className="text-gray-600 mb-4">
          {formData.language === 'ja' 
            ? `${existingResponse?.submittedAt ? new Date(existingResponse.submittedAt).toLocaleString('ja-JP') : ''}に回答を送信済みです。` 
            : `You have already submitted your response${existingResponse?.submittedAt ? ` on ${new Date(existingResponse.submittedAt).toLocaleString('en-US')}` : ''}.`}
        </p>

        <div className="my-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            {formData.language === 'ja' ? '送信済みの内容' : 'Your Previous Response'}
          </h2>
          <table className="info-table">
            <tbody>
              {existingResponse?.hasChildren && (
                <tr>
                  <th>{t.hasChildren}</th>
                  <td>{t.yes} - {existingResponse.childrenDetails}</td>
                </tr>
              )}
              {existingResponse?.arrivalCountryDate && (
                <tr>
                  <th>{t.arrivalCountryDate}</th>
                  <td>{existingResponse.arrivalCountryDate}</td>
                </tr>
              )}
              {existingResponse?.prevNightPlace && (
                <tr>
                  <th>{t.prevNightPlace}</th>
                  <td>{existingResponse.prevNightPlace}</td>
                </tr>
              )}
              {existingResponse?.hasPhone && (
                <tr>
                  <th>{t.phoneNumber}</th>
                  <td>{existingResponse.phoneNumber}</td>
                </tr>
              )}
              {existingResponse?.dinnerRequest && (
                <tr>
                  <th>{t.dinnerRequest}</th>
                  <td>{existingResponse.dinnerRequest === 'yes' ? t.yes : t.no}</td>
                </tr>
              )}
              {existingResponse?.dietaryNeeds && (
                <tr>
                  <th>{t.dietaryNeeds}</th>
                  <td>{t.yes} - {existingResponse.dietaryDetails}</td>
                </tr>
              )}
              {existingResponse?.arrivalTime && (
                <tr>
                  <th>{t.arrivalTime}</th>
                  <td>{existingResponse.arrivalTime}</td>
                </tr>
              )}
              {existingResponse?.needsPickup !== undefined && (
                <tr>
                  <th>{t.needsPickup}</th>
                  <td>{existingResponse.needsPickup ? t.yes : t.no}</td>
                </tr>
              )}
              {existingResponse?.otherNotes && (
                <tr>
                  <th>{t.otherNotes}</th>
                  <td>{existingResponse.otherNotes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-gray-700 mb-6 font-semibold">
          {formData.language === 'ja' 
            ? '内容を変更しますか？' 
            : 'Would you like to modify your response?'}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => { setIsRevision(true); setStep('questions'); }} 
            className="form-button form-button-primary"
          >
            {formData.language === 'ja' ? '変更する' : 'Modify'}
          </button>
          <button 
            onClick={() => setStep('complete')} 
            className="form-button form-button-secondary"
          >
            {formData.language === 'ja' ? 'そのまま' : 'Keep as is'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="form-card">
        <div className="form-card-header">
          {t.reservationDetails}
        </div>
        <table className="info-table">
          <tbody>
            <tr>
              <th>{t.bookingId}</th>
              <td>{reservation.bookingId}</td>
            </tr>
            <tr>
              <th>{t.guestName}</th>
              <td>{reservation.guestName}</td>
            </tr>
            <tr>
              <th>{t.email}</th>
              <td>{reservation.email}</td>
            </tr>
            <tr>
              <th>{t.checkinDate}</th>
              <td>{reservation.checkinDate}</td>
            </tr>
            <tr>
              <th>{t.nights}</th>
              <td>{reservation.nights}{formData.language === 'ja' ? '泊' : ' nights'}</td>
            </tr>
            <tr>
              <th>{t.otaName}</th>
              <td>{reservation.otaName}</td>
            </tr>
            <tr>
              <th>{t.dinnerIncluded}</th>
              <td>{reservation.dinnerIncluded}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-lg mb-4 mt-6 font-semibold text-gray-800">{t.confirmReservation}</p>
        <div className="flex gap-3">
          <button onClick={() => handleConfirm(true)} className="form-button form-button-primary">
            {t.yes}
          </button>
          <button onClick={() => handleConfirm(false)} className="form-button form-button-secondary">
            {t.no}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="bg-purple-600 -m-6 mb-6 rounded-t-lg px-6 py-4">
            <h1 className="text-2xl font-bold text-white text-center">{t.title}</h1>
          </div>
        </div>

        {/* Children */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.hasChildren}</label>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setFormData({ ...formData, hasChildren: true })}
              className={`px-4 py-2 rounded transition-colors ${formData.hasChildren ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {t.yes}
            </button>
            <button
              onClick={() => setFormData({ ...formData, hasChildren: false, childrenDetails: '' })}
              className={`px-4 py-2 rounded transition-colors ${!formData.hasChildren ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          )}
        </div>

        {/* Arrival */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.arrivalCountryDate}</label>
          <input
            type="date"
            value={formData.arrivalCountryDate}
            onChange={(e) => setFormData({ ...formData, arrivalCountryDate: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>

        {/* Prev night */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.prevNightPlace}</label>
          <input
            type="text"
            value={formData.prevNightPlace}
            onChange={(e) => setFormData({ ...formData, prevNightPlace: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
          <div className="important-notice">
            <div className="important-notice-title">
              {formData.language === 'ja' ? '夕食に関する重要なお知らせ' : 'Important Information About Dinner'}
            </div>
            <div className="important-notice-content">
              <pre className="whitespace-pre-wrap font-sans">{t.dinnerNotice}</pre>
            </div>
            <label className="flex items-start gap-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={formData.dinnerConsent}
                onChange={(e) => setFormData({ ...formData, dinnerConsent: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm font-bold text-gray-800">{t.dinnerConsent}</span>
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
          <div className="important-notice">
            <div className="important-notice-title">
              {formData.language === 'ja' ? '到着時刻に関する重要なお願い' : 'Important Notice Regarding Arrival Time'}
            </div>
            <div className="important-notice-content">
              <pre className="whitespace-pre-wrap font-sans">{t.arrivalTimeNotice}</pre>
            </div>
            <label className="flex items-start gap-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={formData.arrivalTimeConsent}
                onChange={(e) => setFormData({ ...formData, arrivalTimeConsent: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm font-bold text-gray-800">{t.arrivalTimeConsent}</span>
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

        {/* Pickup service */}
        <div>
          <label className="block font-semibold mb-2">{t.needsPickup}</label>
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setFormData({ ...formData, needsPickup: true })}
              className={`px-4 py-2 rounded ${formData.needsPickup ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t.yes}
            </button>
            <button
              onClick={() => setFormData({ ...formData, needsPickup: false, pickupConsent: false })}
              className={`px-4 py-2 rounded ${!formData.needsPickup ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {t.no}
            </button>
          </div>
          
          {formData.needsPickup && (
            <div className="important-notice">
              <div className="important-notice-title">
                {formData.language === 'ja' ? '送迎サービスについて' : 'About Pickup Service'}
              </div>
              <div className="important-notice-content">
                <pre className="whitespace-pre-wrap font-sans">{t.pickupNotice}</pre>
              </div>
              <label className="flex items-start gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={formData.pickupConsent}
                  onChange={(e) => setFormData({ ...formData, pickupConsent: e.target.checked })}
                  className="mt-1"
                />
                <span className="text-sm font-bold text-gray-800">{t.pickupConsent}</span>
              </label>
            </div>
          )}
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

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep('confirm')} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
              {t.back}
            </button>
            <button
              onClick={() => {
                // Validation before moving to review
                const errors: string[] = [];
                
                // Validate dinner consent if dinner is included or requested
                if (reservation.dinnerIncluded === 'Yes' || formData.dinnerRequest === 'yes') {
                  if (!formData.dinnerConsent) {
                    errors.push(formData.language === 'ja' 
                      ? '夕食に関する注意事項に同意してください' 
                      : 'Please agree to the dinner terms');
                  }
                  if (!formData.arrivalTimeConsent) {
                    errors.push(formData.language === 'ja' 
                      ? '到着時刻に関する注意事項に同意してください' 
                      : 'Please agree to the arrival time notice');
                  }
                }

                // Validate pickup consent if pickup is needed
                if (formData.needsPickup && !formData.pickupConsent) {
                  errors.push(formData.language === 'ja' 
                    ? '送迎に関する注意事項に同意してください' 
                    : 'Please agree to the pickup service terms');
                }

                if (errors.length > 0) {
                  setModalMessage({
                    type: 'error',
                    title: formData.language === 'ja' ? '入力内容を確認してください' : 'Please check your input',
                    message: formData.language === 'ja' ? '以下の項目を確認してください：' : 'Please review the following:',
                    details: errors,
                  });
                  return;
                }

                setStep('review');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.next}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="form-card">
        <div className="form-card-header">
          {t.reviewTitle}
        </div>
        <p className="text-gray-600 mb-4">{t.reviewMessage}</p>

        <table className="info-table">
          <tbody>
            {formData.hasChildren && (
              <tr>
                <th>{t.hasChildren}</th>
                <td>{t.yes} - {formData.childrenDetails}</td>
              </tr>
            )}
            {formData.arrivalCountryDate && (
              <tr>
                <th>{t.arrivalCountryDate}</th>
                <td>{formData.arrivalCountryDate}</td>
              </tr>
            )}
            {formData.prevNightPlace && (
              <tr>
                <th>{t.prevNightPlace}</th>
                <td>{formData.prevNightPlace}</td>
              </tr>
            )}
            {formData.hasPhone && (
              <tr>
                <th>{t.phoneNumber}</th>
                <td>{formData.phoneNumber}</td>
              </tr>
            )}
            {reservation.dinnerIncluded !== 'Yes' && formData.dinnerRequest && (
              <tr>
                <th>{t.dinnerRequest}</th>
                <td>{formData.dinnerRequest === 'yes' ? t.yes : t.no}</td>
              </tr>
            )}
            {(reservation.dinnerIncluded === 'Yes' || formData.dinnerRequest === 'yes') && formData.dietaryNeeds && (
              <tr>
                <th>{t.dietaryNeeds}</th>
                <td>{t.yes} - {formData.dietaryDetails}</td>
              </tr>
            )}
            {formData.arrivalTime && (
              <tr>
                <th>{t.arrivalTime}</th>
                <td>{formData.arrivalTime}</td>
              </tr>
            )}
            {formData.needsPickup !== undefined && (
              <tr>
                <th>{t.needsPickup}</th>
                <td>{formData.needsPickup ? t.yes : t.no}</td>
              </tr>
            )}
            {formData.otherNotes && (
              <tr>
                <th>{t.otherNotes}</th>
                <td>{formData.otherNotes}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex gap-3 pt-4 mt-6">
          <button onClick={() => setStep('questions')} className="form-button form-button-secondary">
            {t.edit}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="form-button form-button-primary"
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

  return (
    <>
      {modalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setModalMessage(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className={`text-xl font-semibold ${modalMessage.type === 'error' ? 'text-red-600' : modalMessage.type === 'success' ? 'text-green-600' : 'text-orange-600'}`}>
                  {modalMessage.title}
                </h2>
                <button onClick={() => setModalMessage(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <div className="text-gray-700">
                <p className="mb-2">{modalMessage.message}</p>
                {modalMessage.details && modalMessage.details.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {modalMessage.details.map((detail, i) => (
                      <li key={i} className="text-red-600">{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t pt-4">
                <button onClick={() => setModalMessage(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {formData.language === 'ja' ? '閉じる' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {null}
    </>
  );
}
