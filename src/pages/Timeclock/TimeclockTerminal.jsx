import React, { useState, useEffect } from 'react';
import { 
  FiClock, FiCheck, FiX, FiCornerDownLeft, FiArrowLeft, 
  FiLogIn, FiLogOut, FiHelpCircle, FiChevronRight, FiCoffee 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function TimeclockTerminal() {
  const [time, setTime] = useState(new Date());
  const [action, setAction] = useState('arriver'); // 'arriver', 'pause_start', 'pause_end', 'depart'
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorErrorMsg] = useState('');

  // Sockets & Modals State
  const [pendingConfirm, setPendingConfirm] = useState(null); 
  const [successData, setSuccessData] = useState(null);       

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (num) => {
    if (pendingConfirm || successData) return; 
    setErrorErrorMsg('');
    if (pin.length < 4) { 
      setPin((prev) => prev + num);
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorErrorMsg('');
  };

  // 🛑 1. GET GPS COORDINATES & VERIFY [2]
  const handleVerifyPin = async (currentPin = pin) => {
    if (!currentPin || currentPin.length !== 4) {
      return setErrorErrorMsg('Veuillez entrer un code PIN à 4 chiffres.');
    }

    // Ask browser for GPS coordinates [2]
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await submitVerification(currentPin, latitude, longitude); // Send with GPS [2]
      },
      async (error) => {
        // If GPS is disabled by browser, still try (backend will check if coordinates are required)
        console.warn("GPS Access blocked by browser. Attempting without coordinates.");
        await submitVerification(currentPin, null, null);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const submitVerification = async (currentPin, latitude, longitude) => {
    try {
      const res = await api.post('/timeclock/verify', {
        pinCode: currentPin,
        action,
        latitude, // 🛑 Sends GPS to backend [2]
        longitude
      });

      setPendingConfirm(res.data);
      setErrorErrorMsg('');
    } catch (err) {
      setErrorErrorMsg(err.response?.data?.message || 'Une erreur est survenue.');
      setPin('');
    }
  };

  // Auto-submit once the 4th digit is typed [3]
  useEffect(() => {
    if (pin.length === 4) {
      handleVerifyPin(pin);
    }
  }, [pin]);

  // STEP 2: Officially Confirm and Commit Punch
  const handleConfirmPunch = async () => {
    if (!pendingConfirm) return;

    try {
      const res = await api.post('/timeclock/confirm', {
        employeeId: pendingConfirm.employee.id,
        action: pendingConfirm.action
      });

      setSuccessData(res.data);
      setPendingConfirm(null);
      setPin('');

      setTimeout(() => {
        setSuccessData(null);
      }, 3500);

    } catch (err) {
      setErrorErrorMsg(err.response?.data?.message || 'La validation a échoué.');
      setPendingConfirm(null);
      setPin('');
    }
  };

  const handleCancelConfirm = () => {
    setPendingConfirm(null);
    setPin('');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50 px-4 py-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {/* TOP LIVE DIGITAL CLOCK */}
      <div className="text-center space-y-1 mb-8">
        <h1 className="text-5xl font-extrabold tracking-widest font-mono text-zinc-50">
          {time.toLocaleTimeString('fr-FR')}
        </h1>
        <p className="text-sm font-semibold text-zinc-400 capitalize">
          {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl transition-all min-h-[460px] flex flex-col justify-center">
        
        {/* PHASE 3: SUCCESS SPLASH SCREEN */}
        {successData ? (
          <div className="flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-200">
            {successData.employee.avatar ? (
              <img src={successData.employee.avatar} alt="" className="h-24 w-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-emerald-500 text-zinc-950 font-extrabold text-3xl flex items-center justify-center uppercase shadow-lg border-4 border-emerald-400">
                {successData.employee.name.charAt(0)}
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Enregistré à {successData.time}</p>
              <h2 className="text-3xl font-extrabold text-zinc-50 tracking-tight">{successData.employee.name}</h2>
              <p className="text-sm text-zinc-400">{successData.message}</p>
            </div>
          </div>
        ) : 
        
        /* PHASE 2: VISUAL IDENTITY CONFIRMATION CARD */
        pendingConfirm ? (
          <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
            {pendingConfirm.employee.avatar ? (
              <img src={pendingConfirm.employee.avatar} alt={pendingConfirm.employee.name} className="h-28 w-28 rounded-full object-cover border-4 border-indigo-500 shadow-lg" />
            ) : (
              <div className="h-28 w-28 rounded-full bg-indigo-500 text-zinc-950 font-extrabold text-4xl flex items-center justify-center uppercase shadow-lg border-4 border-indigo-400">
                {pendingConfirm.employee.name.charAt(0)}
              </div>
            )}

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                <FiHelpCircle className="h-4 w-4" /> <span>Est-ce bien vous ?</span>
              </div>
              <h2 className="text-3xl font-extrabold text-zinc-50 tracking-tight">
                {pendingConfirm.employee.name}
              </h2>
            </div>

            <div className="flex w-full gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/40 py-3.5 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 active:scale-95 transition-all"
              >
                Non, Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPunch}
                className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center"
              >
                Oui, Confirmer <FiChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          
          /* PHASE 1: KEYPAD ENTRY (Default View) */
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Error Message Box */}
            {errorMsg && (
              <div className="rounded-lg border border-red-950 bg-red-950/20 p-3 text-xs text-red-400 text-center transition">
                {errorMsg}
              </div>
            )}

            {/* 🛑 2. UPGRADED: 4-WAY SELECTION BAR */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAction('arriver')}
                className={`flex items-center justify-center rounded-xl border py-3 text-xs font-bold transition-all ${
                  action === 'arriver'
                    ? 'bg-zinc-50 border-zinc-50 text-zinc-950 shadow-md scale-[1.02]'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FiLogIn className="mr-1.5 h-3.5 w-3.5" /> Arriver
              </button>
              
              <button
                type="button"
                onClick={() => setAction('pause_start')}
                className={`flex items-center justify-center rounded-xl border py-3 text-xs font-bold transition-all ${
                  action === 'pause_start'
                    ? 'bg-amber-50 border-amber-50 text-amber-950 shadow-md scale-[1.02]'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FiCoffee className="mr-1.5 h-3.5 w-3.5" /> Début Pause
              </button>

              <button
                type="button"
                onClick={() => setAction('pause_end')}
                className={`flex items-center justify-center rounded-xl border py-3 text-xs font-bold transition-all ${
                  action === 'pause_end'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-[1.02]'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FiCheck className="mr-1.5 h-3.5 w-3.5" /> Fin Pause
              </button>

              <button
                type="button"
                onClick={() => setAction('depart')}
                className={`flex items-center justify-center rounded-xl border py-3 text-xs font-bold transition-all ${
                  action === 'depart'
                    ? 'bg-zinc-50 border-zinc-50 text-zinc-950 shadow-md scale-[1.02]'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FiLogOut className="mr-1.5 h-3.5 w-3.5" /> Départ
              </button>
            </div>

            {/* Hidden Input Display Dots */}
            <div className="flex justify-center space-x-4 py-1">
              {[...Array(4)].map((_, idx) => (
                <div
                  key={idx}
                  className={`h-5 w-5 rounded-full border transition-all duration-100 ${
                    idx < pin.length
                      ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                      : 'border-zinc-700 bg-zinc-950'
                  }`}
                />
              ))}
            </div>

            {/* Keypad Grid (0-9, Clear) */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 py-3.5 text-lg font-bold hover:bg-zinc-800 active:scale-95 transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 py-3.5 text-xs font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 active:scale-95 transition-all"
              >
                EFFACER
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress(0)}
                className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/40 py-3.5 text-lg font-bold hover:bg-zinc-800 active:scale-95 transition-all"
              >
                0
              </button>
            </div>
          </div>
        )}
      </div>

      {!successData && (
        <a 
          href="/login" 
          className="mt-6 text-xs text-zinc-500 hover:text-zinc-300 transition flex items-center"
        >
          <FiArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Employee Portal
        </a>
      )}
    </div>
  );
}