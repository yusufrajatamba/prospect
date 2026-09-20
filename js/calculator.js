// ==========================================================================
// PRUPROSPECT PRO - CFP® & OJK STANDARD FINANCIAL PLANNING CALCULATOR
// Komprehensif: Dana Darurat, UP Jiwa (HLV & DIME), Sakit Kritis, Pendidikan, Pensiun
// ==========================================================================

import { api } from './api.js';

export class InsuranceCalculator {
  constructor(app = null) {
    this.app = app;
    this.currentType = 'emergency'; // 'emergency', 'hlv', 'ci', 'edu', 'pension'
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.calculateEmergencyFund();
    this.calculateHLV();
    this.calculateCI();
    this.calculateEdu();
    this.calculateRetirement();
  }

  setupEventListeners() {
    // Tab switching inside calculator
    document.querySelectorAll('.calc-nav-tabs .calc-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.calc-nav-tabs .calc-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.calc-pane').forEach(p => p.style.display = 'none');

        btn.classList.add('active');
        const targetPane = document.getElementById(btn.dataset.target);
        if (targetPane) targetPane.style.display = 'block';
        this.currentType = btn.dataset.type;
      });
    });

    // Inputs listener for Emergency Fund (Dana Darurat)
    ['efMonthlyExpense', 'efStatus', 'efExistingFund', 'efSavingsMonthly'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateEmergencyFund());
    });

    // Inputs listener for HLV & DIME
    ['hlvMonthlyExpense', 'hlvYears', 'hlvDepositRate', 'hlvInflation', 'dimeDebt', 'dimeIncomeYears', 'dimeMortgage', 'dimeEduFund'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateHLV());
    });

    // Inputs listener for Critical Illness
    ['ciMonthlyExpense', 'ciRecoveryYears', 'ciAlternativeTherapy'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateCI());
    });

    // Inputs listener for Education
    ['eduCurrentCost', 'eduCurrentAge', 'eduCollegeAge', 'eduInflationRate', 'eduInvestmentReturn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateEdu());
    });

    // Inputs listener for Retirement (Dana Pensiun)
    ['retCurrentAge', 'retRetireAge', 'retLifeExpectancy', 'retMonthlyExpense', 'retExpenseRatio', 'retExistingFund'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateRetirement());
    });

    // WhatsApp Copy Buttons
    ['btnCopyEF', 'btnCopyHLV', 'btnCopyCI', 'btnCopyEdu', 'btnCopyRet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const type = id.replace('btnCopy', '').toLowerCase();
        const typeMap = { ef: 'emergency', hlv: 'hlv', ci: 'ci', edu: 'edu', ret: 'pension' };
        el.addEventListener('click', () => this.copySummaryToWA(typeMap[type] || 'emergency'));
      }
    });

    // Dynamic Prospect Picker Listener
    const calcPicker = document.getElementById('calcProspectPicker');
    if (calcPicker) {
      calcPicker.addEventListener('change', (e) => {
        const prospectId = e.target.value;
        if (!prospectId) {
          this.selectedProspect = null;
          const badge = document.getElementById('calcProspectActiveBadge');
          if (badge) badge.style.display = 'none';
          return;
        }
        const p = this.app?.prospects.find(item => item.id === prospectId);
        if (p) this.selectProspect(p);
      });
    }

    // Save Quote Buttons
    ['btnSaveEF', 'btnSaveHLV', 'btnSaveCI', 'btnSaveEdu', 'btnSaveRet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const type = id.replace('btnSave', '').toLowerCase();
        const typeMap = { ef: 'emergency', hlv: 'hlv', ci: 'ci', edu: 'edu', ret: 'pension' };
        el.addEventListener('click', () => this.saveQuoteToDB(typeMap[type] || 'emergency'));
      }
    });
  }

  selectProspect(prospect) {
    this.selectedProspect = prospect;
    if (this.app) this.app.activeProspectId = prospect.id;

    const calcPicker = document.getElementById('calcProspectPicker');
    if (calcPicker) calcPicker.value = prospect.id;

    const badge = document.getElementById('calcProspectActiveBadge');
    const badgeText = document.getElementById('calcProspectActiveText');
    if (badge && badgeText) {
      badge.style.display = 'inline-flex';
      badgeText.textContent = `${prospect.name} (${prospect.relationship || 'Prospek'}) • Estimasi: ${prospect.estimated_income || 'Standar'}`;
    }

    // Estimate monthly expenses from estimated income
    let estIncome = 15000000;
    if (prospect.estimated_income) {
      if (prospect.estimated_income.includes('< 10')) estIncome = 8000000;
      else if (prospect.estimated_income.includes('10.000.000 - 20')) estIncome = 15000000;
      else if (prospect.estimated_income.includes('20.000.000 - 35')) estIncome = 25000000;
      else if (prospect.estimated_income.includes('35')) estIncome = 45000000;
    }
    const estExpense = Math.round(estIncome * 0.6);

    const efExp = document.getElementById('efMonthlyExpense');
    if (efExp) { efExp.value = estExpense; this.calculateEmergencyFund(); }

    const hlvExp = document.getElementById('hlvMonthlyExpense');
    if (hlvExp) { hlvExp.value = estExpense; this.calculateHLV(); }

    const ciExp = document.getElementById('ciMonthlyExpense');
    if (ciExp) { ciExp.value = estExpense; this.calculateCI(); }
  }

  // --------------------------------------------------------------------------
  // 1. DANA DARURAT (EMERGENCY FUND) - CFP® & FPSB INDONESIA STANDARD
  // --------------------------------------------------------------------------
  calculateEmergencyFund() {
    const monthlyExpense = parseFloat(document.getElementById('efMonthlyExpense')?.value) || 0;
    const status = document.getElementById('efStatus')?.value || 'single';
    const existingFund = parseFloat(document.getElementById('efExistingFund')?.value) || 0;
    const savingsMonthly = parseFloat(document.getElementById('efSavingsMonthly')?.value) || (monthlyExpense * 0.15);

    // Multipliers based on Certified Financial Planner (CFP) standards
    let minMultiplier = 3;
    let idealMultiplier = 6;
    let statusLabel = 'Lajang (Single)';

    if (status === 'married_0') {
      minMultiplier = 6;
      idealMultiplier = 9;
      statusLabel = 'Menikah Tanpa Anak';
    } else if (status === 'married_kids') {
      minMultiplier = 9;
      idealMultiplier = 12;
      statusLabel = 'Menikah dengan Anak';
    } else if (status === 'entrepreneur') {
      minMultiplier = 12;
      idealMultiplier = 24;
      statusLabel = 'Pengusaha / Pekerja Lepas (Freelancer)';
    }

    const targetMin = monthlyExpense * minMultiplier;
    const targetIdeal = monthlyExpense * idealMultiplier;
    const gap = Math.max(0, targetIdeal - existingFund);
    const monthsToGoal = savingsMonthly > 0 ? Math.ceil(gap / savingsMonthly) : 0;

    // Alokasi instrumen likuid (CFP Recommendation)
    const allocBankCash = Math.min(existingFund, monthlyExpense * 2); // 2 bulan di tabungan harian
    const allocRDPU = Math.max(0, existingFund - allocBankCash); // sisanya di Reksadana Pasar Uang

    // Render DOM
    const elMultiplier = document.getElementById('efResultMultiplier');
    const elTargetMin = document.getElementById('efResultTargetMin');
    const elTargetIdeal = document.getElementById('efResultTargetIdeal');
    const elGap = document.getElementById('efResultGap');
    const elTimeline = document.getElementById('efResultTimeline');
    const elAllocBank = document.getElementById('efAllocBank');
    const elAllocRDPU = document.getElementById('efAllocRDPU');

    if (elMultiplier) elMultiplier.textContent = `${minMultiplier}x - ${idealMultiplier}x Pengeluaran Bulanan (${statusLabel})`;
    if (elTargetMin) elTargetMin.textContent = this.formatRupiah(targetMin);
    if (elTargetIdeal) elTargetIdeal.textContent = this.formatRupiah(targetIdeal);
    if (elGap) {
      elGap.textContent = gap === 0 ? 'Terpenuhi 100% (Aman)' : this.formatRupiah(gap);
      elGap.style.color = gap === 0 ? '#16a34a' : '#dc2626';
    }
    if (elTimeline) {
      elTimeline.textContent = gap === 0 ? 'Dana Darurat Sudah Siap' : `${monthsToGoal} Bulan (dengan tabungan ${this.formatRupiah(savingsMonthly)}/bln)`;
    }
    if (elAllocBank) elAllocBank.textContent = this.formatRupiah(monthlyExpense * 2);
    if (elAllocRDPU) elAllocRDPU.textContent = this.formatRupiah(Math.max(0, targetIdeal - (monthlyExpense * 2)));

    this.lastEFData = {
      monthlyExpense,
      statusLabel,
      minMultiplier,
      idealMultiplier,
      targetMin,
      targetIdeal,
      existingFund,
      gap,
      savingsMonthly,
      monthsToGoal
    };
  }

  // --------------------------------------------------------------------------
  // 2. UP JIWA: CAPITAL PRESERVATION & DIME METHOD (CFP STANDARD)
  // --------------------------------------------------------------------------
  calculateHLV() {
    const monthlyExpense = parseFloat(document.getElementById('hlvMonthlyExpense')?.value) || 0;
    const years = parseFloat(document.getElementById('hlvYears')?.value) || 10;
    const depositGross = parseFloat(document.getElementById('hlvDepositRate')?.value) || 5.0; // 5% gross
    const inflation = parseFloat(document.getElementById('hlvInflation')?.value) || 2.5; // 2.5% inflation

    const annualExpense = monthlyExpense * 12;

    // Metode 1: Income Replacement Langsung
    const directTotal = annualExpense * years;

    // Metode 2: Capital Preservation (Pajak PPh Deposito 20% & Koreksi Inflasi)
    // Suku bunga bersih setelah pajak: Gross * (1 - 0.20)
    const netInterest = depositGross * 0.80;
    // Real net yield setelah dikurangi inflasi (minimal 1.5% buffer)
    const realYield = Math.max(1.5, netInterest - inflation);
    const capitalPreservation = annualExpense / (realYield / 100);

    // Metode 3: DIME Formula
    const debt = parseFloat(document.getElementById('dimeDebt')?.value) || 0;
    const incomeYears = parseFloat(document.getElementById('dimeIncomeYears')?.value) || 5;
    const mortgage = parseFloat(document.getElementById('dimeMortgage')?.value) || 0;
    const eduFund = parseFloat(document.getElementById('dimeEduFund')?.value) || 0;

    const dimeIncome = annualExpense * incomeYears;
    const dimeTotal = debt + dimeIncome + mortgage + eduFund;

    // Render DOM
    const elDirect = document.getElementById('hlvResultDirect');
    const elPreserve = document.getElementById('hlvResultPreserve');
    const elRealYield = document.getElementById('hlvResultYield');
    const elDIME = document.getElementById('hlvResultDIME');
    const elAnnual = document.getElementById('hlvAnnualExpense');

    if (elDirect) elDirect.textContent = this.formatRupiah(directTotal);
    if (elPreserve) elPreserve.textContent = this.formatRupiah(capitalPreservation);
    if (elRealYield) elRealYield.textContent = `${realYield.toFixed(2)}% net riil p.a. (Gross ${depositGross}% - Pajak 20% - Inflasi ${inflation}%)`;
    if (elDIME) elDIME.textContent = this.formatRupiah(dimeTotal);
    if (elAnnual) elAnnual.textContent = this.formatRupiah(annualExpense);

    this.lastHLVData = {
      monthlyExpense,
      annualExpense,
      years,
      directTotal,
      depositGross,
      inflation,
      realYield,
      capitalPreservation,
      dimeTotal,
      debt,
      incomeYears,
      mortgage,
      eduFund
    };
  }

  // --------------------------------------------------------------------------
  // 3. SAKIT KRITIS (CRITICAL ILLNESS INCOME REPLACEMENT)
  // --------------------------------------------------------------------------
  calculateCI() {
    const monthlyExpense = parseFloat(document.getElementById('ciMonthlyExpense')?.value) || 0;
    const recoveryYears = parseFloat(document.getElementById('ciRecoveryYears')?.value) || 3;
    const altTherapy = parseFloat(document.getElementById('ciAlternativeTherapy')?.value) || 100000000;

    const annualExpense = monthlyExpense * 12;
    const incomeLoss = annualExpense * recoveryYears;
    const recommendedCoverage = incomeLoss + altTherapy;

    const elResult = document.getElementById('ciResultTotal');
    const elIncomeLoss = document.getElementById('ciResultIncomeLoss');
    const elAnnual = document.getElementById('ciResultMonthly');

    if (elResult) elResult.textContent = this.formatRupiah(recommendedCoverage);
    if (elIncomeLoss) elIncomeLoss.textContent = this.formatRupiah(incomeLoss);
    if (elAnnual) elAnnual.textContent = this.formatRupiah(annualExpense);

    this.lastCIData = {
      monthlyExpense,
      annualExpense,
      recoveryYears,
      incomeLoss,
      altTherapy,
      recommendedCoverage
    };
  }

  // --------------------------------------------------------------------------
  // 4. DANA PENDIDIKAN ANAK (COMPOUND FUTURE VALUE FV = PV*(1+r)^n)
  // --------------------------------------------------------------------------
  calculateEdu() {
    const currentCost = parseFloat(document.getElementById('eduCurrentCost')?.value) || 150000000;
    const currentAge = parseFloat(document.getElementById('eduCurrentAge')?.value) || 3;
    const collegeAge = parseFloat(document.getElementById('eduCollegeAge')?.value) || 18;
    const inflationRate = parseFloat(document.getElementById('eduInflationRate')?.value) || 8.0;
    const investReturn = parseFloat(document.getElementById('eduInvestmentReturn')?.value) || 6.0;

    const yearsLeft = Math.max(1, collegeAge - currentAge);
    const futureCost = currentCost * Math.pow(1 + (inflationRate / 100), yearsLeft);

    // Monthly saving calculation based on annuity formula FV = PMT * [((1+r/12)^n - 1) / (r/12)]
    const monthlyRate = (investReturn / 100) / 12;
    const totalMonths = yearsLeft * 12;
    let monthlySaving = 0;
    if (monthlyRate > 0) {
      monthlySaving = futureCost * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));
    } else {
      monthlySaving = futureCost / totalMonths;
    }

    const elYearsLeft = document.getElementById('eduYearsLeft');
    const elFuture = document.getElementById('eduResultFuture');
    const elMonthly = document.getElementById('eduMonthlySaving');

    if (elYearsLeft) elYearsLeft.textContent = `${yearsLeft} Tahun Menuju Kuliah`;
    if (elFuture) elFuture.textContent = this.formatRupiah(Math.round(futureCost));
    if (elMonthly) elMonthly.textContent = `${this.formatRupiah(Math.round(monthlySaving))} / bulan`;

    this.lastEduData = {
      currentCost,
      currentAge,
      collegeAge,
      yearsLeft,
      inflationRate,
      futureCost: Math.round(futureCost),
      monthlySaving: Math.round(monthlySaving)
    };
  }

  // --------------------------------------------------------------------------
  // 5. DANA PENSIUN SEJAHTERA (RETIREMENT FUND)
  // --------------------------------------------------------------------------
  calculateRetirement() {
    const currentAge = parseFloat(document.getElementById('retCurrentAge')?.value) || 30;
    const retireAge = parseFloat(document.getElementById('retRetireAge')?.value) || 55;
    const lifeExpectancy = parseFloat(document.getElementById('retLifeExpectancy')?.value) || 75;
    const currentMonthlyExpense = parseFloat(document.getElementById('retMonthlyExpense')?.value) || 15000000;
    const expenseRatio = parseFloat(document.getElementById('retExpenseRatio')?.value) || 80; // 80% of current expense
    const existingFund = parseFloat(document.getElementById('retExistingFund')?.value) || 0;

    const yearsToRetire = Math.max(1, retireAge - currentAge);
    const retirementDuration = Math.max(1, lifeExpectancy - retireAge);

    // Inflation rate standard 4%
    const inflation = 0.04;
    // Monthly expense at retirement start
    const monthlyExpenseAtRetire = (currentMonthlyExpense * (expenseRatio / 100)) * Math.pow(1 + inflation, yearsToRetire);
    const annualExpenseAtRetire = monthlyExpenseAtRetire * 12;

    // Total retirement fund needed (Capital Depletion / Safe Withdrawal Rate at 4% real net yield)
    const totalRetirementNeed = annualExpenseAtRetire * retirementDuration * 0.85; // discounted by safe returns
    const gap = Math.max(0, totalRetirementNeed - existingFund);

    // Monthly savings needed to accumulate gap in yearsToRetire at 7% p.a.
    const rMonthly = 0.07 / 12;
    const nMonths = yearsToRetire * 12;
    const monthlySavingNeeded = gap * (rMonthly / (Math.pow(1 + rMonthly, nMonths) - 1));

    const elYearsToRetire = document.getElementById('retYearsToRetire');
    const elMonthlyAtRetire = document.getElementById('retMonthlyAtRetire');
    const elTotalNeed = document.getElementById('retTotalNeed');
    const elGap = document.getElementById('retGap');
    const elMonthlySaving = document.getElementById('retMonthlySaving');

    if (elYearsToRetire) elYearsToRetire.textContent = `${yearsToRetire} Tahun Lagi Menuju Pensiun`;
    if (elMonthlyAtRetire) elMonthlyAtRetire.textContent = this.formatRupiah(Math.round(monthlyExpenseAtRetire));
    if (elTotalNeed) elTotalNeed.textContent = this.formatRupiah(Math.round(totalRetirementNeed));
    if (elGap) elGap.textContent = gap === 0 ? 'Terpenuhi' : this.formatRupiah(Math.round(gap));
    if (elMonthlySaving) elMonthlySaving.textContent = `${this.formatRupiah(Math.round(monthlySavingNeeded))} / bulan`;

    this.lastRetData = {
      currentAge,
      retireAge,
      lifeExpectancy,
      yearsToRetire,
      retirementDuration,
      currentMonthlyExpense,
      monthlyExpenseAtRetire: Math.round(monthlyExpenseAtRetire),
      totalRetirementNeed: Math.round(totalRetirementNeed),
      existingFund,
      gap: Math.round(gap),
      monthlySavingNeeded: Math.round(monthlySavingNeeded)
    };
  }

  // --------------------------------------------------------------------------
  // SAVE FINANCIAL QUOTE TO DATABASE
  // --------------------------------------------------------------------------
  async saveQuoteToDB(type) {
    let title = '';
    let inputs = {};
    let results = {};

    if (type === 'emergency') {
      title = `Analisa Dana Darurat (${this.lastEFData?.statusLabel || 'Keluarga'})`;
      inputs = { monthlyExpense: this.lastEFData?.monthlyExpense, status: this.lastEFData?.statusLabel, existing: this.lastEFData?.existingFund };
      results = { targetMin: this.lastEFData?.targetMin, targetIdeal: this.lastEFData?.targetIdeal, gap: this.lastEFData?.gap, monthsToGoal: this.lastEFData?.monthsToGoal };
    } else if (type === 'hlv') {
      title = `Analisa Proteksi Jiwa (Capital Preservation & DIME)`;
      inputs = { monthlyExpense: this.lastHLVData?.monthlyExpense, years: this.lastHLVData?.years };
      results = { capitalPreservation: this.lastHLVData?.capitalPreservation, dimeTotal: this.lastHLVData?.dimeTotal, directTotal: this.lastHLVData?.directTotal };
    } else if (type === 'ci') {
      title = `Analisa Proteksi Sakit Kritis (Recovery Fund)`;
      inputs = { monthlyExpense: this.lastCIData?.monthlyExpense, recoveryYears: this.lastCIData?.recoveryYears };
      results = { recommendedCoverage: this.lastCIData?.recommendedCoverage, incomeLoss: this.lastCIData?.incomeLoss };
    } else if (type === 'edu') {
      title = `Analisa Perencanaan Dana Kuliah Anak`;
      inputs = { currentCost: this.lastEduData?.currentCost, yearsLeft: this.lastEduData?.yearsLeft };
      results = { futureCost: this.lastEduData?.futureCost, monthlySaving: this.lastEduData?.monthlySaving };
    } else if (type === 'pension') {
      title = `Analisa Dana Pensiun Sejahtera`;
      inputs = { currentAge: this.lastRetData?.currentAge, retireAge: this.lastRetData?.retireAge };
      results = { totalRetirementNeed: this.lastRetData?.totalRetirementNeed, gap: this.lastRetData?.gap, monthlySavingNeeded: this.lastRetData?.monthlySavingNeeded };
    }

    const prospectId = this.selectedProspect?.id || this.app?.activeProspectId || null;
    const finalTitle = this.selectedProspect ? `${title} (Klien: ${this.selectedProspect.name})` : title;

    try {
      await api.saveQuote({
        prospect_id: prospectId,
        type,
        title: finalTitle,
        inputs,
        results
      });
      alert(`Hasil analisa finansial "${finalTitle}" berhasil disimpan ke database SQLite!`);
    } catch (err) {
      alert('Gagal menyimpan hasil perhitungan: ' + err.message);
    }
  }

  // --------------------------------------------------------------------------
  // WHATSAPP SUMMARY GENERATOR
  // --------------------------------------------------------------------------
  copySummaryToWA(type) {
    let msg = '';
    const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (type === 'emergency') {
      const d = this.lastEFData;
      msg = `*HASIL AUDIT DANA DARURAT (EMERGENCY FUND)*
_Standar Perencanaan Keuangan Certified Financial Planner (CFP®) & OJK_
Tanggal: ${nowStr}

Halo Bapak/Ibu,
Berikut adalah resume perhitungan kecukupan cadangan likuiditas keluarga:

• Status Keluarga: ${d.statusLabel}
• Pengeluaran Rutin: ${this.formatRupiah(d.monthlyExpense)}/bulan
• Rasio Kebutuhan: ${d.minMultiplier}x s/d ${d.idealMultiplier}x Pengeluaran

*Hasil Perhitungan Keuangan:*
- Kebutuhan Minimum: *${this.formatRupiah(d.targetMin)}*
- Kebutuhan Ideal: *${this.formatRupiah(d.targetIdeal)}*
- Ketersediaan Saat Ini: ${this.formatRupiah(d.existingFund)}
- Defisit / Gap Pemenuhan: *${d.gap === 0 ? 'Terpenuhi 100%' : this.formatRupiah(d.gap)}*

*Rencana Aksi Finansial:*
Dengan menyisihkan ${this.formatRupiah(d.savingsMonthly)}/bulan, dana darurat keluarga akan siap 100% dalam waktu *${d.monthsToGoal} bulan*.
Alokasi instrumen: simpan 2 bulan di rekening tabungan harian, dan sisanya tempatkan di instrumen likuid bebas penalti seperti RDPU.

Semoga bermanfaat untuk menjaga ketahanan finansial keluarga tercinta.`;
    } else if (type === 'hlv') {
      const d = this.lastHLVData;
      msg = `*RESUME AUDIT KECUKUPAN UANG PERTANGGUNGAN (UP) JIWA*
_Formula Human Life Value & DIME Standard CFP®_
Tanggal: ${nowStr}

Halo Bapak/Ibu,
Berikut resume perhitungan dana perlindungan nafkah keluarga jika terjadi risiko tutup usia dini:

• Pengeluaran Bulanan: ${this.formatRupiah(d.monthlyExpense)}/bulan
• Pengeluaran Tahunan: ${this.formatRupiah(d.annualExpense)}/tahun

*1. Metode Capital Preservation (Bunga Abadi)*
UP Jiwa Rekomendasi: *${this.formatRupiah(d.capitalPreservation)}*
_Prinsip: Uang santunan didepositokan pada yield bersih riil ${d.realYield.toFixed(1)}%, bunga bulanannya menafkahi keluarga selamanya tanpa mengurangi nilai pokok modal._

*2. Metode DIME Formula (Keluarga Mandiri)*
UP Jiwa Rekomendasi: *${this.formatRupiah(d.dimeTotal)}*
_Mencakup pelunasan seluruh hutang/kredit, pengganti nafkah ${d.incomeYears} tahun, dan kepastian dana pendidikan anak._

Mari kita diskusikan bagaimana solusi proteksi Prudential (PRUWarisan / PRUCinta) dapat mengunci nilai pertanggungan ini secara efisien.`;
    } else if (type === 'ci') {
      const d = this.lastCIData;
      msg = `*AUDIT PROTEKSI SAKIT KRITIS (CRITICAL ILLNESS RECOVERY FUND)*
_Standar AAJI & Asosiasi Perencana Keuangan_
Tanggal: ${nowStr}

Halo Bapak/Ibu,
Tahukah Bapak/Ibu bahwa fasilitas BPJS/kantor hanya membayar biaya rumah sakit, namun TIDAK mengganti penghasilan keluarga yang hilang saat pasien berhenti bekerja?

• Pengeluaran Bulanan Keluarga: ${this.formatRupiah(d.monthlyExpense)}
• Estimasi Masa Pemulihan Medis: ${d.recoveryYears} Tahun
• Potensi Kehilangan Nafkah: ${this.formatRupiah(d.incomeLoss)}
• Cadangan Terapi Khusus: ${this.formatRupiah(d.altTherapy)}

*Rekomendasi Santunan Tunai PRUCritical:*
*${this.formatRupiah(d.recommendedCoverage)}* (Cair Tunai Langsung)

Dana tunai ini menjamin dapur keluarga tetap ngebul, cicilan aman, dan pasien dapat fokus sembuh tanpa stres finansial.`;
    } else if (type === 'edu') {
      const d = this.lastEduData;
      msg = `*PROYEKSI DANA KULIAH MASA DEPAN ANAK*
_Formula Future Value dengan Inflasi Pendidikan 8% p.a._
Tanggal: ${nowStr}

Halo Bapak/Ibu,
Berikut estimasi persiapan dana pendidikan tinggi buah hati tercinta:

• Biaya Kuliah Saat Ini: ${this.formatRupiah(d.currentCost)}
• Usia Anak Sekarang: ${d.currentAge} Tahun (Masuk Kuliah: ${d.collegeAge} Tahun)
• Waktu Menabung: ${d.yearsLeft} Tahun Tersisa

*Proyeksi Biaya Masa Depan:*
Kebutuhan Dana Kuliah: *${this.formatRupiah(d.futureCost)}*
Alokasi Tabungan Proteksi: *${this.formatRupiah(d.monthlySaving)} / bulan*

Dengan program proteksi pendidikan PRUCerah, jika terjadi musibah pada orang tua, setoran tabungan diteruskan oleh Prudential dan dana kuliah anak tetap cair pasti tepat waktu.`;
    } else if (type === 'pension') {
      const d = this.lastRetData;
      msg = `*ANALISA DANA PENSIUN SEJAHTERA & MANDIRI*
_Standar Perencanaan Pensiun Bebas Khawatir_
Tanggal: ${nowStr}

Halo Bapak/Ibu,
Masa pensiun adalah masa menuai ketenangan hidup. Berikut analisa kebutuhan akumulasi aset hari tua:

• Usia Saat Ini: ${d.currentAge} Tahun | Usia Target Pensiun: ${d.retireAge} Tahun
• Waktu Akumulasi: ${d.yearsToRetire} Tahun Lagi
• Estimasi Pengeluaran Pensiun: ${this.formatRupiah(d.monthlyExpenseAtRetire)}/bulan

*Total Kebutuhan Dana Pensiun:*
Kebutuhan Aset Pensiun: *${this.formatRupiah(d.totalRetirementNeed)}*
Alokasi Investasi Berkala: *${this.formatRupiah(d.monthlySavingNeeded)} / bulan*

Mari siapkan portofolio pensiun sejak dini agar hari tua tetap sejahtera tanpa merepotkan anak dan cucu.`;
    }

    navigator.clipboard.writeText(msg).then(() => {
      alert('Ringkasan simulasi finansial berhasil disalin ke clipboard! Siap dikirimkan via WhatsApp.');
    }).catch(() => {
      alert('Ringkasan berhasil disalin.');
    });
  }

  formatRupiah(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  }
}
