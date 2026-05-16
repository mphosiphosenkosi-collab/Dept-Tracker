import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './index.css'

function App() {
  // ========== STATE ==========
  const [debtors, setDebtors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newDebtor, setNewDebtor] = useState({ name: '', phone: '' })
  const [editingPhone, setEditingPhone] = useState(null)
  const [tempPhone, setTempPhone] = useState('')
  const [selectedDebtor, setSelectedDebtor] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState('debt')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionItem, setTransactionItem] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // ========== HELPER FUNCTIONS ==========
  const calculateDebt = (transactions) => {
    let totalDebt = 0
    let totalPaid = 0

    transactions.forEach(t => {
      if (t.type === 'debt') totalDebt += t.amount
      if (t.type === 'payment') totalPaid += t.amount
    })

    return totalDebt - totalPaid
  }

  const formatCurrency = (amount) => {
    return `R ${amount.toFixed(2)}`
  }

 // ========== LOCALSTORAGE ==========
const loadDebtorsFromStorage = () => {
  const saved = localStorage.getItem('debtTracker_debtors')
  if (saved) {
    return JSON.parse(saved)
  }
  // Sample data for first-time users
  return [
    {
      id: 1,
      name: "Thabo's Spaza",
      phone: "0712345678",
      transactions: [
        { id: 1, type: "debt", amount: 450, item: "Maize meal & sugar", date: "2026-05-10" },
        { id: 2, type: "payment", amount: 200, date: "2026-05-15" }
      ]
    },
    {
      id: 2,
      name: "Lindiwe Catering",
      phone: "0823456789",
      transactions: [
        { id: 1, type: "debt", amount: 1200, item: "Chicken & rice", date: "2026-05-12" }
      ]
    },
    {
      id: 3,
      name: "Mama Rosie's Bakery",
      phone: "",
      transactions: [
        { id: 1, type: "debt", amount: 350, item: "Bread & flour", date: "2026-05-14" }
      ]
    }
  ]
}

const saveDebtorsToStorage = (debtorsData) => {
  localStorage.setItem('debtTracker_debtors', JSON.stringify(debtorsData))
}

// ========== SAMPLE DATA RESET ==========
const resetSampleData = () => {
  if (window.confirm('Add 3 sample customers to help you learn the app? This will NOT delete your existing data.')) {
    const sampleData = [
      {
        id: Date.now() + 1,
        name: "Thabo's Spaza (Sample)",
        phone: "0712345678",
        transactions: [
          { id: Date.now() + 101, type: "debt", amount: 450, item: "Maize meal & sugar", date: "2026-05-10" },
          { id: Date.now() + 102, type: "payment", amount: 200, date: "2026-05-15" }
        ]
      },
      {
        id: Date.now() + 2,
        name: "Lindiwe Catering (Sample)",
        phone: "0823456789",
        transactions: [
          { id: Date.now() + 103, type: "debt", amount: 1200, item: "Chicken & rice", date: "2026-05-12" }
        ]
      },
      {
        id: Date.now() + 3,
        name: "Mama Rosie's Bakery (Sample)",
        phone: "",
        transactions: [
          { id: Date.now() + 104, type: "debt", amount: 350, item: "Bread & flour", date: "2026-05-14" }
        ]
      }
    ]
    
    setDebtors([...debtors, ...sampleData])
    alert('✅ Sample customers added! You can delete them anytime.')
  }
}



  // ========== CORE BUSINESS LOGIC ==========
  const addDebtor = () => {
    if (!newDebtor.name.trim()) return alert('Please enter a name')

    const newDebtorObj = {
      id: Date.now(),
      name: newDebtor.name,
      phone: newDebtor.phone,
      transactions: []
    }

    setDebtors([...debtors, newDebtorObj])
    setNewDebtor({ name: '', phone: '' })
    setShowForm(false)
  }

  const addTransaction = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const amount = parseFloat(transactionAmount)
    const newTransaction = {
      id: Date.now(),
      type: transactionType,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      item: transactionType === 'debt' ? transactionItem : undefined
    }

    const updatedDebtors = debtors.map(debtor => {
      if (debtor.id === selectedDebtor.id) {
        return {
          ...debtor,
          transactions: [...debtor.transactions, newTransaction]
        }
      }
      return debtor
    })

    setDebtors(updatedDebtors)
    setTransactionAmount('')
    setTransactionItem('')
    setShowTransactionModal(false)
    setSelectedDebtor(null)
  }

  const deleteTransaction = (debtorId, transactionId) => {
    if (window.confirm('Delete this transaction?')) {
      const updatedDebtors = debtors.map(debtor => {
        if (debtor.id === debtorId) {
          return {
            ...debtor,
            transactions: debtor.transactions.filter(t => t.id !== transactionId)
          }
        }
        return debtor
      })
      setDebtors(updatedDebtors)
    }
  }

  // ========== WHATSAPP ==========
  const getWhatsAppMessage = (debtor) => {
    const debtAmount = calculateDebt(debtor.transactions)
    const message = `Hi ${debtor.name}, kindly remember your outstanding balance of ${formatCurrency(debtAmount)} at our shop. Please settle when possible. Thank you!`
    return encodeURIComponent(message)
  }

  const sendWhatsAppReminder = (debtor) => {
    if (!debtor.phone) {
      alert(`No phone number saved for ${debtor.name}. Please add a phone number first.`)
      return
    }

    const message = getWhatsAppMessage(debtor)
    const whatsappUrl = `https://wa.me/${debtor.phone}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  // ========== CSV EXPORT ==========
  const exportToCSV = () => {
    // Create clean, readable rows
    const csvRows = []

    // ===== HEADER SECTION =====
    csvRows.push(['"DEBT TRACKER SA - COMPLETE EXPORT REPORT"'])
    csvRows.push([`"Generated: ${new Date().toLocaleString('en-ZA')}"`])
    csvRows.push([`"Report ID: ${Date.now()}"`])
    csvRows.push([]) // Empty row for spacing

    // ===== SUMMARY SECTION =====
    csvRows.push(['"=== 1. SUMMARY ==="'])

    const totalOwed = debtors.reduce((total, debtor) => total + calculateDebt(debtor.transactions), 0)
    const totalDebtGiven = debtors.reduce((total, debtor) => {
      return total + debtor.transactions
        .filter(t => t.type === 'debt')
        .reduce((sum, t) => sum + t.amount, 0)
    }, 0)
    const totalPayments = debtors.reduce((total, debtor) => {
      return total + debtor.transactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0)
    }, 0)
    const activeDebtors = debtors.filter(d => calculateDebt(d.transactions) > 0).length
    const settledDebtors = debtors.filter(d => calculateDebt(d.transactions) === 0 && d.transactions.length > 0).length
    const debtorsWithNoTransactions = debtors.filter(d => d.transactions.length === 0).length

    csvRows.push(['"Total Customers in System"', `"${debtors.length}"`])
    csvRows.push(['"Active Debtors (Owes Money)"', `"${activeDebtors}"`])
    csvRows.push(['"Settled Customers"', `"${settledDebtors}"`])
    csvRows.push(['"Customers with No Activity"', `"${debtorsWithNoTransactions}"`])
    csvRows.push([])
    csvRows.push(['"Total Credit Given (All Debts)"', `"R ${totalDebtGiven.toFixed(2)}"`])
    csvRows.push(['"Total Payments Received"', `"R ${totalPayments.toFixed(2)}"`])
    csvRows.push(['"CURRENT OUTSTANDING TOTAL"', `"R ${totalOwed.toFixed(2)}"`])
    csvRows.push([])

    // Calculate average debt per active customer
    const avgDebt = activeDebtors > 0 ? totalOwed / activeDebtors : 0
    csvRows.push(['"Average Debt per Active Customer"', `"R ${avgDebt.toFixed(2)}"`])
    csvRows.push([])
    csvRows.push([])

    // ===== CUSTOMER SUMMARY TABLE =====
    csvRows.push(['"=== 2. CUSTOMER SUMMARY (Quick View) ==="'])
    csvRows.push(['"Customer Name"', '"Phone Number"', '"Current Balance"', '"Status"', '"Total Transactions"'])

    // Sort by highest debt first
    const sortedDebtors = [...debtors].sort((a, b) => {
      return calculateDebt(b.transactions) - calculateDebt(a.transactions)
    })

    sortedDebtors.forEach(debtor => {
      const balance = calculateDebt(debtor.transactions)
      let status = ''
      if (balance > 0) status = '🔴 OWES MONEY'
      else if (balance < 0) status = '🟡 Credit Balance (Overpaid)'
      else status = '🟢 Settled'

      csvRows.push([
        `"${debtor.name}"`,
        `"${debtor.phone || 'No phone number'}"`,
        `"R ${balance.toFixed(2)}"`,
        `"${status}"`,
        `"${debtor.transactions.length}"`
      ])
    })

    csvRows.push([])
    csvRows.push([])

    // ===== HIGHEST DEBTORS =====
    csvRows.push(['"=== 3. TOP 5 HIGHEST DEBTORS ==="'])
    csvRows.push(['"Rank"', '"Customer Name"', '"Phone"', '"Amount Owed"'])

    const topDebtors = [...debtors]
      .filter(d => calculateDebt(d.transactions) > 0)
      .sort((a, b) => calculateDebt(b.transactions) - calculateDebt(a.transactions))
      .slice(0, 5)

    topDebtors.forEach((debtor, index) => {
      csvRows.push([
        `"${index + 1}"`,
        `"${debtor.name}"`,
        `"${debtor.phone || 'No phone'}"`,
        `"R ${calculateDebt(debtor.transactions).toFixed(2)}"`
      ])
    })

    if (topDebtors.length === 0) {
      csvRows.push(['"No debtors found"', '""', '""', '""'])
    }

    csvRows.push([])
    csvRows.push([])

    // ===== DETAILED TRANSACTIONS =====
    csvRows.push(['"=== 4. DETAILED TRANSACTION HISTORY ==="'])
    csvRows.push(['"Customer Name"', '"Transaction Type"', '"Amount"', '"Item / Description"', '"Date"', '"Transaction ID"'])

    debtors.forEach(debtor => {
      if (debtor.transactions.length === 0) {
        csvRows.push([
          `"${debtor.name}"`,
          '"No transactions"',
          '"-"',
          '"-"',
          '"-"',
          '"-"'
        ])
      } else {
        // Show most recent first
        const sortedTransactions = [...debtor.transactions].reverse()
        sortedTransactions.forEach(t => {
          const typeDisplay = t.type === 'debt' ? 'DEBT (Customer took goods)' : 'PAYMENT (Customer paid)'
          csvRows.push([
            `"${debtor.name}"`,
            `"${typeDisplay}"`,
            `"R ${t.amount.toFixed(2)}"`,
            `"${t.item || '-'}"`,
            `"${t.date}"`,
            `"${t.id}"`
          ])
        })
      }
    })

    csvRows.push([])
    csvRows.push([])

    // ===== DEBTORS WITH NO PHONE NUMBER =====
    const debtorsWithoutPhone = debtors.filter(d => !d.phone || d.phone.trim() === '')
    if (debtorsWithoutPhone.length > 0) {
      csvRows.push(['"=== 5. CUSTOMERS MISSING PHONE NUMBERS ==="'])
      csvRows.push(['"Customer Name"', '"Current Balance"', '"Action Needed"'])
      debtorsWithoutPhone.forEach(debtor => {
        csvRows.push([
          `"${debtor.name}"`,
          `"R ${calculateDebt(debtor.transactions).toFixed(2)}"`,
          '"Add phone number to enable WhatsApp reminders"'
        ])
      })
      csvRows.push([])
      csvRows.push([])
    }

    // ===== HELP SECTION =====
    csvRows.push(['"=== 6. HOW TO READ THIS FILE ==="'])
    csvRows.push(['"💡 TIPS FOR USING THIS EXPORT:"'])
    csvRows.push(['"• Section 1: Shows your business summary (total owed, payments received)"'])
    csvRows.push(['"• Section 2: Quick view of all customers and their balances"'])
    csvRows.push(['"• Section 3: Focus on your biggest debtors (priority collection)"'])
    csvRows.push(['"• Section 4: Complete record of every transaction"'])
    csvRows.push(['"• Section 5: Customers you cannot WhatsApp yet (needs phone numbers)"'])
    csvRows.push(['""'])
    csvRows.push(['"📞 FOR SUPPORT:"'])
    csvRows.push(['"• Save this file for your records"'])
    csvRows.push(['"• Share with your accountant for bookkeeping"'])
    csvRows.push(['"• Use in Excel/Google Sheets to filter and sort"'])
    csvRows.push(['"• R means Rand (South African currency)"'])

    // Convert to CSV string
    const csvString = csvRows.map(row => row.join(',')).join('\n')

    // Download file
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' }) // \uFEFF fixes Excel encoding
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '-')
    a.href = url
    a.download = `Debt_Tracker_SA_Export_${dateStr}_${timeStr}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ========== CLEAR DATA (DEBUG) ==========
  const clearAllData = () => {
    if (window.confirm('⚠️ WARNING: This will delete ALL debtors. Are you sure?')) {
      setDebtors([])
      localStorage.removeItem('debtTracker_debtors')
    }
  }

  // ========== EFFECTS ==========
  useEffect(() => {
    setDebtors(loadDebtorsFromStorage())
  }, [])

  useEffect(() => {
    if (debtors.length > 0) {
      saveDebtorsToStorage(debtors)
    }
  }, [debtors])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ========== COMPUTED VALUES ==========
  const totalOwed = debtors.reduce((total, debtor) => total + calculateDebt(debtor.transactions), 0)
  const averageDebt = debtors.length > 0 ? Math.round(totalOwed / debtors.length) : 0
  const debtorsWithBalance = debtors.filter(d => calculateDebt(d.transactions) > 0)

  // ========== RENDER ==========
  return (
    <div className="app">
      <div className="container">

        {/* HEADER */}
        <div style={{ textAlign: 'center', margin: '40px 0 20px 0' }}>
          <h1 style={{ color: 'var(--navy)', marginBottom: '8px' }}> Debt Tracker SA</h1>
          <p style={{ color: 'var(--brown-dark)' }}>For spazas, tuck shops & small businesses</p>
        </div>

        {/* DASHBOARD WITH CHARTS */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--navy)', marginBottom: '15px' }}> Dashboard</h2>

          {/* Stats Cards */}
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '30px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ flex: 1, padding: '15px', background: 'var(--peach-soft)', borderRadius: '8px' }}>
              <strong style={{ fontSize: '14px' }}>Total Debtors</strong>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--navy)' }}>
                {debtors.length}
              </div>
            </div>
            <div style={{ flex: 1, padding: '15px', background: 'var(--peach-soft)', borderRadius: '8px' }}>
              <strong style={{ fontSize: '14px' }}>Total Owed</strong>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--navy)' }}>
                {formatCurrency(totalOwed)}
              </div>
            </div>
            <div style={{ flex: 1, padding: '15px', background: 'var(--peach-soft)', borderRadius: '8px' }}>
              <strong style={{ fontSize: '14px' }}>Average Debt</strong>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--navy)' }}>
                {formatCurrency(averageDebt)}
              </div>
            </div>
          </div>

          {/* Charts */}
          {debtors.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Top Debtors</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={debtorsWithBalance.slice(0, 5).map(d => ({ name: d.name, value: calculateDebt(d.transactions) }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: R${value}`}
                      labelLine={false}
                    >
                      {debtorsWithBalance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--navy)' : 'var(--brown-dark)'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Debt by Customer</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={debtorsWithBalance.slice(0, 5)}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => `R${value}`} />
                    <Bar dataKey={(d) => calculateDebt(d.transactions)} fill="var(--navy)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* EXPORT BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>
             Export to CSV
          </button>
          <button className="btn btn-secondary" onClick={resetSampleData} style={{ background: '#6B8E6B' }}>
            🔄 Add Sample Customers
          </button>
          <button className="btn btn-secondary" onClick={clearAllData} style={{ background: '#999' }}>
            🗑️ Clear All Data
          </button>
        </div>

        {/* DEBTOR LIST */}
        <h2 style={{ color: 'var(--navy)', marginBottom: '15px' }}>Customers with Credit</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {debtors.map(debtor => {
            const currentDebt = calculateDebt(debtor.transactions)
            return (
              <div key={debtor.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Left side - Name & Phone */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--navy)', marginBottom: '5px' }}>{debtor.name}</h3>

                    {editingPhone === debtor.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '5px', flexWrap: 'wrap' }}>
                        <input
                          type="tel"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                          placeholder="Phone number (e.g., 0712345678)"
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--beige-warm)', fontSize: '14px', flex: 1 }}
                        />
                        <button
                          onClick={() => {
                            const updatedDebtors = debtors.map(d =>
                              d.id === debtor.id ? { ...d, phone: tempPhone } : d
                            )
                            setDebtors(updatedDebtors)
                            setEditingPhone(null)
                            setTempPhone('')
                          }}
                          style={{ padding: '6px 12px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPhone(null)}
                          style={{ padding: '6px 12px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--brown-dark)', fontSize: '14px' }}>
                        📞 {debtor.phone || 'No phone '}
                        <button
                          onClick={() => {
                            setTempPhone(debtor.phone || '')
                            setEditingPhone(debtor.id)
                          }}
                          style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            background: 'var(--beige-warm)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: 'white'
                          }}
                        >
                          {debtor.phone ? 'Edit' : 'Add'}
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Right side - Amount & Actions */}
                  <div style={{ textAlign: 'right', marginTop: isMobile ? '12px' : 0 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentDebt > 0 ? 'var(--navy)' : 'green' }}>
                      {formatCurrency(currentDebt)}
                    </div>
                    {debtor.phone && (
                      <div style={{ fontSize: '11px', color: 'green', marginTop: '4px' }}>
                        ✓ WhatsApp ready
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => sendWhatsAppReminder(debtor)}
                        style={{ fontSize: '13px', padding: '6px 12px' }}
                      >
                        WhatsApp
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedDebtor(debtor)
                          setShowTransactionModal(true)
                          setTransactionType('debt')
                        }}
                        style={{ fontSize: '13px', padding: '6px 12px' }}
                      >
                        Record
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div style={{ marginTop: '15px', borderTop: '1px solid var(--beige-warm)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--navy)' }}>
                      Recent Transactions:
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--brown-dark)' }}>
                      {debtor.transactions.length} total
                    </p>
                  </div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {debtor.transactions.slice().reverse().slice(0, 5).map(t => (
                      <div key={t.id} style={{
                        fontSize: '12px',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--beige-warm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: t.type === 'debt' ? 'var(--navy)' : 'green' }}>
                            {t.type === 'debt' ? '🔴 DEBT' : '🟢 PAYMENT'}:
                          </span>
                          {t.type === 'debt' && t.item && ` ${t.item}`}
                          <span style={{ fontSize: '10px', color: 'var(--beige-warm)', marginLeft: '8px' }}>
                            {t.date}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold', marginRight: '8px' }}>
                            R{t.amount}
                          </span>
                          <button
                            onClick={() => deleteTransaction(debtor.id, t.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#999',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                            title="Delete transaction"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    ))}
                    {debtor.transactions.length === 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--beige-warm)', textAlign: 'center', padding: '8px' }}>
                        No transactions yet. Click "Record" to start.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ADD DEBTOR BUTTON & FORM */}
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          {!showForm ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              style={{ fontSize: '18px', padding: '12px 24px' }}
            >
              + Add New Debtor
            </button>
          ) : (
            <div className="card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--navy)' }}>Add New Customer</h3>
              <input
                type="text"
                placeholder="Customer name*"
                value={newDebtor.name}
                onChange={(e) => setNewDebtor({ ...newDebtor, name: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid var(--beige-warm)', fontSize: '16px' }}
              />
              <input
                type="tel"
                placeholder="Phone number (for WhatsApp reminders)"
                value={newDebtor.phone}
                onChange={(e) => setNewDebtor({ ...newDebtor, phone: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid var(--beige-warm)', fontSize: '16px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={addDebtor}>Save Customer</button>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* TRANSACTION MODAL */}
        {showTransactionModal && selectedDebtor && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div className="card" style={{
              maxWidth: '450px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--navy)' }}>
                {transactionType === 'debt' ? 'Add Debt' : 'Record Payment'} for {selectedDebtor.name}
              </h3>

              {/* Transaction Type Toggle */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => setTransactionType('debt')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: transactionType === 'debt' ? 'var(--navy)' : 'var(--beige-warm)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ➕ Debt (Customer Owes)
                </button>
                <button
                  onClick={() => setTransactionType('payment')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: transactionType === 'payment' ? 'var(--brown-dark)' : 'var(--beige-warm)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Payment (Customer Pays)
                </button>
              </div>

              {/* Amount Input */}
              <input
                type="number"
                placeholder="Amount in Rands (e.g., 150)"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '6px', border: '1px solid var(--beige-warm)', fontSize: '16px' }}
              />

              {/* Item Description (only for debts) */}
              {transactionType === 'debt' && (
                <input
                  type="text"
                  placeholder="What did they buy? (e.g., Bread, Milk, Sugar)"
                  value={transactionItem}
                  onChange={(e) => setTransactionItem(e.target.value)}
                  style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid var(--beige-warm)', fontSize: '16px' }}
                />
              )}

              {/* Current Balance Info */}
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                background: 'var(--peach-soft)',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                Current balance: <strong>{formatCurrency(calculateDebt(selectedDebtor.transactions))}</strong>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={addTransaction}
                  style={{ flex: 1 }}
                >
                  {transactionType === 'debt' ? 'Add Debt' : 'Record Payment'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowTransactionModal(false)
                    setSelectedDebtor(null)
                    setTransactionAmount('')
                    setTransactionItem('')
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '20px',
          borderTop: '1px solid var(--beige-warm)',
          fontSize: '12px',
          color: 'var(--brown-dark)'
        }}>
          <p>Debt Tracker SA — Helping small businesses get paid. All Rights Reserved.-Project-T</p>
          <p style={{ marginTop: '8px' }}>Data saved locally on this device</p>
        </div>

      </div>
    </div>
  )
}

export default App