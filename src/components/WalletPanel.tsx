import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { authState } from '../store/auth';
import {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  getWalletBalances,
  getTransactions,
  createTransaction,
  type PaymentMethod,
  type WalletBalance,
  type Transaction,
  type PaymentMethodType,
  type Currency,
} from '../lib/supabase';
import '../styles/wallet.css';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB'];
const FIAT_CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP'];
const CRYPTO_CURRENCIES: Currency[] = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB'];

const PAYMENT_TYPES: { id: PaymentMethodType; name: string; icon: string }[] = [
  { id: 'BANK_ACCOUNT', name: 'Bank Account', icon: 'B' },
  { id: 'CRYPTO_WALLET', name: 'Crypto Wallet', icon: 'C' },
  { id: 'CARD', name: 'Debit/Credit Card', icon: 'D' },
  { id: 'PAYMENT_PROCESSOR', name: 'Payment Processor', icon: 'P' },
];

const WalletPanel: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'balance' | 'deposit' | 'withdraw' | 'history' | 'methods'>('balance');
  const [paymentMethods, setPaymentMethods] = createSignal<PaymentMethod[]>([]);
  const [balances, setBalances] = createSignal<WalletBalance[]>([]);
  const [transactions, setTransactions] = createSignal<Transaction[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');

  const [showAddMethod, setShowAddMethod] = createSignal(false);
  const [newMethodType, setNewMethodType] = createSignal<PaymentMethodType>('BANK_ACCOUNT');
  const [newMethodProvider, setNewMethodProvider] = createSignal('');
  const [newMethodName, setNewMethodName] = createSignal('');
  const [newMethodAccount, setNewMethodAccount] = createSignal('');
  const [newMethodCurrency, setNewMethodCurrency] = createSignal<Currency>('USD');

  const [depositAmount, setDepositAmount] = createSignal('');
  const [depositCurrency, setDepositCurrency] = createSignal<Currency>('USD');
  const [depositMethodId, setDepositMethodId] = createSignal('');

  const [withdrawAmount, setWithdrawAmount] = createSignal('');
  const [withdrawCurrency, setWithdrawCurrency] = createSignal<Currency>('USD');
  const [withdrawMethodId, setWithdrawMethodId] = createSignal('');

  const loadData = async () => {
    if (!authState.user) return;
    setLoading(true);
    setError('');

    const [methods, walletBalances, txHistory] = await Promise.all([
      getPaymentMethods(authState.user.id),
      getWalletBalances(authState.user.id),
      getTransactions(authState.user.id),
    ]);

    setPaymentMethods(methods);
    setBalances(walletBalances);
    setTransactions(txHistory);
    setLoading(false);
  };

  createEffect(() => {
    if (authState.user) {
      loadData();
    }
  });

  const totalBalanceUSD = () => {
    const rates: Record<Currency, number> = {
      USD: 1, EUR: 1.08, GBP: 1.27,
      USDT: 1, USDC: 1,
      BTC: 43000, ETH: 2600, SOL: 100, BNB: 310,
    };
    return balances().reduce((sum, b) => sum + b.balance * (rates[b.currency] || 1), 0);
  };

  const handleAddMethod = async () => {
    if (!authState.user) return;
    if (!newMethodProvider() || !newMethodName() || !newMethodAccount()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    const { error: addError } = await addPaymentMethod(
      authState.user.id,
      newMethodType(),
      newMethodProvider(),
      newMethodName(),
      newMethodAccount(),
      newMethodCurrency()
    );

    if (addError) {
      setError(addError.message);
    } else {
      setSuccess('Payment method added successfully');
      setShowAddMethod(false);
      resetMethodForm();
      await loadData();
    }
    setLoading(false);
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    const { error: delError } = await deletePaymentMethod(id);
    if (!delError) {
      await loadData();
    }
  };

  const handleDeposit = async () => {
    if (!authState.user) return;
    const amount = parseFloat(depositAmount());
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!depositMethodId()) {
      setError('Select a payment method');
      return;
    }

    setLoading(true);
    setError('');

    const { error: txError } = await createTransaction(
      authState.user.id,
      'DEPOSIT',
      depositCurrency(),
      amount,
      depositMethodId(),
      `Deposit ${amount} ${depositCurrency()}`
    );

    if (txError) {
      setError(txError.message);
    } else {
      setSuccess('Deposit request submitted. Processing time: 1-3 business days.');
      setDepositAmount('');
      await loadData();
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!authState.user) return;
    const amount = parseFloat(withdrawAmount());
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!withdrawMethodId()) {
      setError('Select a payment method');
      return;
    }

    const balance = balances().find(b => b.currency === withdrawCurrency());
    const available = (balance?.balance || 0) - (balance?.lockedBalance || 0);
    if (amount > available) {
      setError(`Insufficient balance. Available: ${available.toFixed(2)} ${withdrawCurrency()}`);
      return;
    }

    setLoading(true);
    setError('');

    const { error: txError } = await createTransaction(
      authState.user.id,
      'WITHDRAWAL',
      withdrawCurrency(),
      amount,
      withdrawMethodId(),
      `Withdraw ${amount} ${withdrawCurrency()}`
    );

    if (txError) {
      setError(txError.message);
    } else {
      setSuccess('Withdrawal request submitted. Processing time: 1-5 business days.');
      setWithdrawAmount('');
      await loadData();
    }
    setLoading(false);
  };

  const resetMethodForm = () => {
    setNewMethodType('BANK_ACCOUNT');
    setNewMethodProvider('');
    setNewMethodName('');
    setNewMethodAccount('');
    setNewMethodCurrency('USD');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const maskAccount = (account: string) => {
    if (account.length <= 4) return account;
    return '****' + account.slice(-4);
  };

  const getMethodIcon = (type: PaymentMethodType) => {
    return PAYMENT_TYPES.find(t => t.id === type)?.icon || '?';
  };

  const compatibleMethods = (currency: Currency) => {
    const isFiat = FIAT_CURRENCIES.includes(currency);
    return paymentMethods().filter(m => {
      if (isFiat) return m.type === 'BANK_ACCOUNT' || m.type === 'CARD' || m.type === 'PAYMENT_PROCESSOR';
      return m.type === 'CRYPTO_WALLET' || m.currency === currency;
    });
  };

  return (
    <div class="wallet-panel">
      <div class="wallet-tabs">
        <button classList={{ active: activeTab() === 'balance' }} onClick={() => setActiveTab('balance')}>Balance</button>
        <button classList={{ active: activeTab() === 'deposit' }} onClick={() => setActiveTab('deposit')}>Deposit</button>
        <button classList={{ active: activeTab() === 'withdraw' }} onClick={() => setActiveTab('withdraw')}>Withdraw</button>
        <button classList={{ active: activeTab() === 'methods' }} onClick={() => setActiveTab('methods')}>Accounts</button>
        <button classList={{ active: activeTab() === 'history' }} onClick={() => setActiveTab('history')}>History</button>
      </div>

      <Show when={error()}>
        <div class="wallet-alert error">{error()}</div>
      </Show>
      <Show when={success()}>
        <div class="wallet-alert success">{success()}</div>
      </Show>

      <div class="wallet-content">
        <Show when={activeTab() === 'balance'}>
          <div class="balance-section">
            <div class="total-balance">
              <span class="label">Total Balance (USD)</span>
              <span class="value">${totalBalanceUSD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="currency-balances">
              <Show when={balances().length === 0}>
                <div class="empty-state">No balances yet. Make your first deposit to get started.</div>
              </Show>
              <For each={balances()}>
                {(bal) => (
                  <div class="balance-card">
                    <div class="currency-info">
                      <span class="currency-symbol">{bal.currency}</span>
                      <span class="balance-amount">{bal.balance.toFixed(CRYPTO_CURRENCIES.includes(bal.currency) ? 8 : 2)}</span>
                    </div>
                    <div class="balance-details">
                      <span>Available: {(bal.balance - bal.lockedBalance).toFixed(CRYPTO_CURRENCIES.includes(bal.currency) ? 8 : 2)}</span>
                      <span>Locked: {bal.lockedBalance.toFixed(CRYPTO_CURRENCIES.includes(bal.currency) ? 8 : 2)}</span>
                    </div>
                    <div class="balance-stats">
                      <span class={bal.totalPnl >= 0 ? 'positive' : 'negative'}>
                        PnL: {bal.totalPnl >= 0 ? '+' : ''}{bal.totalPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'deposit'}>
          <div class="deposit-section">
            <h3>Deposit Funds</h3>
            <div class="form-group">
              <label>Currency</label>
              <select value={depositCurrency()} onChange={(e) => setDepositCurrency(e.currentTarget.value as Currency)}>
                <For each={CURRENCIES}>{(c) => <option value={c}>{c}</option>}</For>
              </select>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" min="0" value={depositAmount()} onInput={(e) => setDepositAmount(e.currentTarget.value)} placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>From Payment Method</label>
              <select value={depositMethodId()} onChange={(e) => setDepositMethodId(e.currentTarget.value)}>
                <option value="">Select payment method</option>
                <For each={compatibleMethods(depositCurrency())}>
                  {(m) => <option value={m.id}>{m.name} ({maskAccount(m.accountIdentifier)})</option>}
                </For>
              </select>
            </div>
            <button class="btn btn-primary" onClick={handleDeposit} disabled={loading()}>
              {loading() ? 'Processing...' : 'Submit Deposit'}
            </button>
          </div>
        </Show>

        <Show when={activeTab() === 'withdraw'}>
          <div class="withdraw-section">
            <h3>Withdraw Funds</h3>
            <div class="form-group">
              <label>Currency</label>
              <select value={withdrawCurrency()} onChange={(e) => setWithdrawCurrency(e.currentTarget.value as Currency)}>
                <For each={CURRENCIES}>{(c) => <option value={c}>{c}</option>}</For>
              </select>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" min="0" value={withdrawAmount()} onInput={(e) => setWithdrawAmount(e.currentTarget.value)} placeholder="0.00" />
              <Show when={balances().find(b => b.currency === withdrawCurrency())}>
                {(bal) => (
                  <span class="available-balance">
                    Available: {(bal().balance - bal().lockedBalance).toFixed(CRYPTO_CURRENCIES.includes(withdrawCurrency()) ? 8 : 2)} {withdrawCurrency()}
                  </span>
                )}
              </Show>
            </div>
            <div class="form-group">
              <label>To Payment Method</label>
              <select value={withdrawMethodId()} onChange={(e) => setWithdrawMethodId(e.currentTarget.value)}>
                <option value="">Select payment method</option>
                <For each={compatibleMethods(withdrawCurrency())}>
                  {(m) => <option value={m.id}>{m.name} ({maskAccount(m.accountIdentifier)})</option>}
                </For>
              </select>
            </div>
            <button class="btn btn-primary" onClick={handleWithdraw} disabled={loading()}>
              {loading() ? 'Processing...' : 'Submit Withdrawal'}
            </button>
          </div>
        </Show>

        <Show when={activeTab() === 'methods'}>
          <div class="methods-section">
            <div class="section-header">
              <h3>Payment Methods</h3>
              <button class="btn btn-small btn-primary" onClick={() => setShowAddMethod(true)}>+ Add Account</button>
            </div>
            <Show when={paymentMethods().length === 0}>
              <div class="empty-state">No payment methods configured. Add an account to enable deposits and withdrawals.</div>
            </Show>
            <div class="methods-list">
              <For each={paymentMethods()}>
                {(method) => (
                  <div class="method-card" classList={{ unverified: !method.isVerified }}>
                    <div class="method-icon">{getMethodIcon(method.type)}</div>
                    <div class="method-info">
                      <div class="method-name">{method.name}</div>
                      <div class="method-details">
                        <span>{method.provider}</span>
                        <span>{maskAccount(method.accountIdentifier)}</span>
                        <span>{method.currency}</span>
                      </div>
                      <div class="method-badges">
                        <Show when={method.isVerified}>
                          <span class="badge verified">Verified</span>
                        </Show>
                        <Show when={!method.isVerified}>
                          <span class="badge pending">Pending Verification</span>
                        </Show>
                      </div>
                    </div>
                    <button class="btn btn-small btn-danger" onClick={() => handleDeleteMethod(method.id)}>Remove</button>
                  </div>
                )}
              </For>
            </div>

            <Show when={showAddMethod()}>
              <div class="add-method-form">
                <h4>Add Payment Method</h4>
                <div class="form-group">
                  <label>Type</label>
                  <select value={newMethodType()} onChange={(e) => setNewMethodType(e.currentTarget.value as PaymentMethodType)}>
                    <For each={PAYMENT_TYPES}>{(t) => <option value={t.id}>{t.name}</option>}</For>
                  </select>
                </div>
                <div class="form-group">
                  <label>Provider/Bank Name</label>
                  <input type="text" value={newMethodProvider()} onInput={(e) => setNewMethodProvider(e.currentTarget.value)} placeholder="e.g., Chase, Coinbase, PayPal" />
                </div>
                <div class="form-group">
                  <label>Account Name</label>
                  <input type="text" value={newMethodName()} onInput={(e) => setNewMethodName(e.currentTarget.value)} placeholder="e.g., My Checking Account" />
                </div>
                <div class="form-group">
                  <label>Account Number / Wallet Address</label>
                  <input type="text" value={newMethodAccount()} onInput={(e) => setNewMethodAccount(e.currentTarget.value)} placeholder="Enter account identifier" />
                </div>
                <div class="form-group">
                  <label>Currency</label>
                  <select value={newMethodCurrency()} onChange={(e) => setNewMethodCurrency(e.currentTarget.value as Currency)}>
                    <For each={CURRENCIES}>{(c) => <option value={c}>{c}</option>}</For>
                  </select>
                </div>
                <div class="form-actions">
                  <button class="btn" onClick={() => { setShowAddMethod(false); resetMethodForm(); }}>Cancel</button>
                  <button class="btn btn-primary" onClick={handleAddMethod} disabled={loading()}>
                    {loading() ? 'Adding...' : 'Add Method'}
                  </button>
                </div>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={activeTab() === 'history'}>
          <div class="history-section">
            <h3>Transaction History</h3>
            <Show when={transactions().length === 0}>
              <div class="empty-state">No transactions yet.</div>
            </Show>
            <div class="transactions-list">
              <For each={transactions()}>
                {(tx) => (
                  <div class="transaction-row">
                    <div class="tx-type" classList={{
                      deposit: tx.type === 'DEPOSIT',
                      withdrawal: tx.type === 'WITHDRAWAL',
                      profit: tx.type === 'TRADE_PROFIT',
                      loss: tx.type === 'TRADE_LOSS',
                    }}>
                      {tx.type.replace('_', ' ')}
                    </div>
                    <div class="tx-details">
                      <span class="tx-amount">{tx.type === 'WITHDRAWAL' || tx.type === 'TRADE_LOSS' ? '-' : '+'}{tx.amount.toFixed(CRYPTO_CURRENCIES.includes(tx.currency) ? 8 : 2)} {tx.currency}</span>
                      <span class="tx-date">{formatDate(tx.createdAt)}</span>
                    </div>
                    <div class="tx-status" classList={{
                      pending: tx.status === 'PENDING',
                      completed: tx.status === 'COMPLETED',
                      failed: tx.status === 'FAILED',
                    }}>
                      {tx.status}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default WalletPanel;
