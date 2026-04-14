import { Component, createSignal, For, Show } from 'solid-js';
import { authState, authActions } from '../store/auth';
import { addApiKey, deleteApiKey, toggleApiKey, type ApiKeyProvider } from '../lib/supabase';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_PROVIDERS: { id: ApiKeyProvider; name: string; description: string; needsSecret: boolean }[] = [
  { id: 'BYBIT', name: 'Bybit', description: 'Cryptocurrency exchange for live trading', needsSecret: true },
  { id: 'BINANCE', name: 'Binance', description: 'Cryptocurrency exchange for live trading', needsSecret: true },
  { id: 'OPENAI', name: 'OpenAI', description: 'GPT models for sentiment analysis', needsSecret: false },
  { id: 'DEEPSEEK', name: 'DeepSeek', description: 'Alternative LLM for sentiment analysis', needsSecret: false },
  { id: 'NEWS_API', name: 'NewsAPI', description: 'Real-time news feed for market sentiment', needsSecret: false },
  { id: 'ALPHA_VANTAGE', name: 'Alpha Vantage', description: 'Market data and indicators', needsSecret: false },
];

const SettingsPanel: Component<SettingsPanelProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<'api-keys' | 'preferences'>('api-keys');
  const [showAddKey, setShowAddKey] = createSignal(false);
  const [selectedProvider, setSelectedProvider] = createSignal<ApiKeyProvider>('BYBIT');
  const [keyName, setKeyName] = createSignal('');
  const [apiKey, setApiKey] = createSignal('');
  const [apiSecret, setApiSecret] = createSignal('');
  const [isTestnet, setIsTestnet] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const currentProvider = () => API_PROVIDERS.find(p => p.id === selectedProvider());

  const handleAddKey = async () => {
    if (!authState.user) return;
    if (!apiKey()) {
      setError('API Key is required');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: saveError } = await addApiKey(
      authState.user.id,
      selectedProvider(),
      keyName() || `${selectedProvider()} Key`,
      apiKey(),
      currentProvider()?.needsSecret ? apiSecret() : null,
      isTestnet()
    );

    if (saveError) {
      setError(saveError.message);
    } else if (data) {
      authActions.addApiKey({
        id: data.id,
        provider: selectedProvider(),
        keyName: keyName() || `${selectedProvider()} Key`,
        isTestnet: isTestnet(),
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date().toISOString(),
      });
      resetForm();
      setShowAddKey(false);
    }

    setLoading(false);
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    const { error: deleteError } = await deleteApiKey(keyId);
    if (!deleteError) {
      authActions.removeApiKey(keyId);
    }
  };

  const handleToggleKey = async (keyId: string, isActive: boolean) => {
    const { error: toggleError } = await toggleApiKey(keyId, !isActive);
    if (!toggleError) {
      authActions.updateApiKey(keyId, { isActive: !isActive });
    }
  };

  const resetForm = () => {
    setKeyName('');
    setApiKey('');
    setApiSecret('');
    setIsTestnet(false);
    setError('');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay" onClick={() => props.onClose()}>
        <div class="modal-container settings-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">Settings</h2>
            <button class="modal-close" onClick={() => props.onClose()}>
              &times;
            </button>
          </div>

          <div class="settings-tabs">
            <button
              class="settings-tab"
              classList={{ active: activeTab() === 'api-keys' }}
              onClick={() => setActiveTab('api-keys')}
            >
              API Keys
            </button>
            <button
              class="settings-tab"
              classList={{ active: activeTab() === 'preferences' }}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
          </div>

          <div class="settings-content">
            <Show when={activeTab() === 'api-keys'}>
              <div class="api-keys-section">
                <div class="section-header">
                  <h3>Connected Services</h3>
                  <button
                    class="btn btn-small btn-primary"
                    onClick={() => setShowAddKey(true)}
                  >
                    + Add API Key
                  </button>
                </div>

                <Show when={authState.apiKeys.length === 0}>
                  <div class="empty-state">
                    <p>No API keys configured yet.</p>
                    <p class="text-muted">Add API keys to enable live trading and real-time data.</p>
                  </div>
                </Show>

                <div class="api-keys-list">
                  <For each={authState.apiKeys}>
                    {(key) => (
                      <div class="api-key-card" classList={{ inactive: !key.isActive }}>
                        <div class="api-key-info">
                          <div class="api-key-header">
                            <span class="api-key-provider">{key.provider}</span>
                            <Show when={key.isTestnet}>
                              <span class="api-key-badge testnet">Testnet</span>
                            </Show>
                            <span
                              class="api-key-badge"
                              classList={{ active: key.isActive, inactive: !key.isActive }}
                            >
                              {key.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div class="api-key-name">{key.keyName}</div>
                          <div class="api-key-meta">
                            <span>Added: {formatDate(key.createdAt)}</span>
                            <span>Last used: {formatDate(key.lastUsedAt)}</span>
                          </div>
                        </div>
                        <div class="api-key-actions">
                          <button
                            class="btn btn-small"
                            onClick={() => handleToggleKey(key.id, key.isActive)}
                            title={key.isActive ? 'Disable' : 'Enable'}
                          >
                            {key.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            class="btn btn-small btn-danger"
                            onClick={() => handleDeleteKey(key.id)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                <Show when={showAddKey()}>
                  <div class="add-key-form">
                    <h4>Add New API Key</h4>

                    <Show when={error()}>
                      <div class="form-error">{error()}</div>
                    </Show>

                    <div class="form-group">
                      <label class="form-label">Provider</label>
                      <select
                        class="form-select"
                        value={selectedProvider()}
                        onChange={(e) => setSelectedProvider(e.currentTarget.value as ApiKeyProvider)}
                      >
                        <For each={API_PROVIDERS}>
                          {(provider) => (
                            <option value={provider.id}>{provider.name}</option>
                          )}
                        </For>
                      </select>
                      <p class="form-help">{currentProvider()?.description}</p>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Key Name (optional)</label>
                      <input
                        type="text"
                        class="form-input"
                        value={keyName()}
                        onInput={(e) => setKeyName(e.currentTarget.value)}
                        placeholder="e.g., My Trading Key"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">API Key</label>
                      <input
                        type="password"
                        class="form-input"
                        value={apiKey()}
                        onInput={(e) => setApiKey(e.currentTarget.value)}
                        placeholder="Enter your API key"
                      />
                    </div>

                    <Show when={currentProvider()?.needsSecret}>
                      <div class="form-group">
                        <label class="form-label">API Secret</label>
                        <input
                          type="password"
                          class="form-input"
                          value={apiSecret()}
                          onInput={(e) => setApiSecret(e.currentTarget.value)}
                          placeholder="Enter your API secret"
                        />
                      </div>
                    </Show>

                    <Show when={selectedProvider() === 'BYBIT' || selectedProvider() === 'BINANCE'}>
                      <div class="form-group form-checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={isTestnet()}
                            onChange={(e) => setIsTestnet(e.currentTarget.checked)}
                          />
                          <span>Use Testnet (recommended for testing)</span>
                        </label>
                      </div>
                    </Show>

                    <div class="form-actions">
                      <button
                        class="btn"
                        onClick={() => {
                          setShowAddKey(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        class="btn btn-primary"
                        onClick={handleAddKey}
                        disabled={loading()}
                      >
                        {loading() ? 'Saving...' : 'Save API Key'}
                      </button>
                    </div>
                  </div>
                </Show>

                <div class="api-info-box">
                  <h4>Supported Services</h4>
                  <ul>
                    <li><strong>Bybit/Binance:</strong> Live cryptocurrency trading with WebSocket feeds</li>
                    <li><strong>OpenAI/DeepSeek:</strong> AI-powered sentiment analysis for news</li>
                    <li><strong>NewsAPI:</strong> Real-time news aggregation for market sentiment</li>
                    <li><strong>Alpha Vantage:</strong> Technical indicators and market data</li>
                  </ul>
                  <p class="text-muted">All API keys are encrypted and stored securely.</p>
                </div>
              </div>
            </Show>

            <Show when={activeTab() === 'preferences'}>
              <div class="preferences-section">
                <div class="form-group">
                  <label class="form-label">Default Exchange</label>
                  <select
                    class="form-select"
                    value={authState.settings?.defaultExchange || 'BYBIT'}
                    onChange={(e) => authActions.updateSettings({ defaultExchange: e.currentTarget.value })}
                  >
                    <option value="BYBIT">Bybit</option>
                    <option value="BINANCE">Binance</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Default Risk Tolerance</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={authState.settings?.riskTolerance || 0.5}
                    onInput={(e) => authActions.updateSettings({ riskTolerance: parseFloat(e.currentTarget.value) })}
                    class="form-range"
                  />
                  <span class="form-range-value">
                    {((authState.settings?.riskTolerance || 0.5) * 100).toFixed(0)}%
                  </span>
                </div>

                <div class="form-group form-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={authState.settings?.autoTrade || false}
                      onChange={(e) => authActions.updateSettings({ autoTrade: e.currentTarget.checked })}
                    />
                    <span>Enable Auto-Trading (requires exchange API keys)</span>
                  </label>
                </div>

                <div class="form-group form-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={authState.settings?.notificationsEnabled || true}
                      onChange={(e) => authActions.updateSettings({ notificationsEnabled: e.currentTarget.checked })}
                    />
                    <span>Enable Notifications</span>
                  </label>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SettingsPanel;
