import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: "survey" | "micro-task";
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  isCompleted: boolean;
}

export interface AffiliateLink {
  id: string;
  title: string;
  description: string;
  url: string;
  commissionRate: number;
  category: string;
}

export interface Transaction {
  id: string;
  type: "earn" | "payout";
  amount: number;
  description: string;
  status: "completed" | "pending" | "processing" | "failed";
  createdAt: string;
  category?: string;
}

export interface UserData {
  balance: number;
  totalEarned: number;
  totalPaidOut: number;
  pendingPayouts: number;
  name: string;
  email: string;
}

export interface AppState {
  user: UserData;
  tasks: Task[];
  affiliates: AffiliateLink[];
  transactions: Transaction[];
}

// Initial sample data
const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Schnelle Umfrage",
    description: "Beantworten Sie 10 Fragen zu Ihren Einkaufsgewohnheiten",
    reward: 2.5,
    category: "survey",
    difficulty: "easy",
    estimatedTime: 10,
    isCompleted: false,
  },
  {
    id: "task-2",
    title: "5 Videos ansehen",
    description: "Schauen Sie sich kurze Werbevideos an und verdienen Sie Geld",
    reward: 1.0,
    category: "micro-task",
    difficulty: "easy",
    estimatedTime: 5,
    isCompleted: false,
  },
  {
    id: "task-3",
    title: "Produkttest-Umfrage",
    description: "Testen Sie ein neues Produkt und teilen Sie Ihre Meinung",
    reward: 5.0,
    category: "survey",
    difficulty: "medium",
    estimatedTime: 20,
    isCompleted: false,
  },
  {
    id: "task-4",
    title: "Dateneingabe",
    description: "Übertragen Sie Daten aus Bildern in ein Formular",
    reward: 3.0,
    category: "micro-task",
    difficulty: "easy",
    estimatedTime: 15,
    isCompleted: false,
  },
  {
    id: "task-5",
    title: "Marktforschung",
    description: "Ausführliche Umfrage zu aktuellen Markttrends",
    reward: 7.5,
    category: "survey",
    difficulty: "hard",
    estimatedTime: 30,
    isCompleted: false,
  },
];

const initialAffiliates: AffiliateLink[] = [
  {
    id: "aff-1",
    title: "Amazon Prime",
    description: "Verdienen Sie €5 für jede Prime-Anmeldung über Ihren Link",
    url: "https://amazon.de/prime",
    commissionRate: 5.0,
    category: "shopping",
  },
  {
    id: "aff-2",
    title: "Online-Kurse",
    description: "10% Provision auf alle Kursverkäufe",
    url: "https://example.com/courses",
    commissionRate: 0.1,
    category: "education",
  },
  {
    id: "aff-3",
    title: "Fitness-App",
    description: "€3 für jeden App-Download über Ihren Link",
    url: "https://example.com/fitness",
    commissionRate: 3.0,
    category: "health",
  },
];

const initialUser: UserData = {
  balance: 45.5,
  totalEarned: 127.5,
  totalPaidOut: 80.0,
  pendingPayouts: 0,
  name: "Max Mustermann",
  email: "max@example.com",
};

const initialTransactions: Transaction[] = [
  {
    id: "tx-1",
    type: "earn",
    amount: 5.0,
    description: "Produkttest-Umfrage abgeschlossen",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    category: "survey",
  },
  {
    id: "tx-2",
    type: "earn",
    amount: 2.5,
    description: "Schnelle Umfrage abgeschlossen",
    status: "completed",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    category: "survey",
  },
  {
    id: "tx-3",
    type: "payout",
    amount: 20.0,
    description: "SEPA-Auszahlung an DE89...4567",
    status: "completed",
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: "tx-4",
    type: "earn",
    amount: 3.0,
    description: "Amazon Prime Affiliate-Provision",
    status: "completed",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    category: "affiliate",
  },
];

const STORAGE_KEY = "easygeld_app_state";

// Store functions
export async function loadState(): Promise<AppState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading state:", error);
  }
  
  // Return initial state if nothing stored
  return {
    user: initialUser,
    tasks: initialTasks,
    affiliates: initialAffiliates,
    transactions: initialTransactions,
  };
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving state:", error);
  }
}

export async function completeTask(taskId: string): Promise<{ success: boolean; reward: number; message: string }> {
  const state = await loadState();
  const task = state.tasks.find((t) => t.id === taskId);
  
  if (!task) {
    return { success: false, reward: 0, message: "Aufgabe nicht gefunden" };
  }
  
  if (task.isCompleted) {
    return { success: false, reward: 0, message: "Aufgabe bereits abgeschlossen" };
  }
  
  // Mark task as completed
  task.isCompleted = true;
  
  // Update user balance
  state.user.balance += task.reward;
  state.user.totalEarned += task.reward;
  
  // Add transaction
  const transaction: Transaction = {
    id: `tx-${Date.now()}`,
    type: "earn",
    amount: task.reward,
    description: `${task.title} abgeschlossen`,
    status: "completed",
    createdAt: new Date().toISOString(),
    category: task.category,
  };
  state.transactions.unshift(transaction);
  
  await saveState(state);
  
  return { success: true, reward: task.reward, message: `Sie haben €${task.reward.toFixed(2)} verdient!` };
}

export async function trackAffiliateClick(affiliateId: string): Promise<{ success: boolean; reward: number; message: string }> {
  const state = await loadState();
  const affiliate = state.affiliates.find((a) => a.id === affiliateId);
  
  if (!affiliate) {
    return { success: false, reward: 0, message: "Affiliate-Link nicht gefunden" };
  }
  
  // Simulate earning (in real app, this would be tracked server-side)
  const reward = 0.1; // €0.10 per click for demo
  
  state.user.balance += reward;
  state.user.totalEarned += reward;
  
  const transaction: Transaction = {
    id: `tx-${Date.now()}`,
    type: "earn",
    amount: reward,
    description: `${affiliate.title} Link geteilt`,
    status: "completed",
    createdAt: new Date().toISOString(),
    category: "affiliate",
  };
  state.transactions.unshift(transaction);
  
  await saveState(state);
  
  return { success: true, reward, message: `Sie haben €${reward.toFixed(2)} verdient!` };
}

export async function requestPayout(iban: string, amount: number): Promise<{ success: boolean; message: string }> {
  const state = await loadState();
  
  // Validate IBAN (German only)
  if (!iban.toUpperCase().startsWith("DE")) {
    return { success: false, message: "Nur deutsche IBANs (DE) werden unterstützt" };
  }
  
  if (iban.replace(/\s/g, "").length !== 22) {
    return { success: false, message: "Ungültige IBAN-Länge" };
  }
  
  // Validate amount
  if (amount < 20) {
    return { success: false, message: "Mindestauszahlung beträgt €20" };
  }
  
  if (amount > state.user.balance) {
    return { success: false, message: "Nicht genügend Guthaben" };
  }
  
  // Process payout
  state.user.balance -= amount;
  state.user.totalPaidOut += amount;
  state.user.pendingPayouts += amount;
  
  const maskedIban = iban.slice(0, 4) + "..." + iban.slice(-4);
  
  const transaction: Transaction = {
    id: `tx-${Date.now()}`,
    type: "payout",
    amount: amount,
    description: `SEPA-Auszahlung an ${maskedIban}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  state.transactions.unshift(transaction);
  
  await saveState(state);
  
  return { 
    success: true, 
    message: `Auszahlung von €${amount.toFixed(2)} wurde beantragt. Die Bearbeitung dauert 2-3 Werktage.` 
  };
}

export async function resetToInitialState(): Promise<void> {
  // Deep clone to avoid mutating the original objects
  const initialState: AppState = {
    user: { ...initialUser },
    tasks: initialTasks.map(t => ({ ...t, isCompleted: false })),
    affiliates: initialAffiliates.map(a => ({ ...a })),
    transactions: initialTransactions.map(t => ({ ...t })),
  };
  // Reset user balance to initial value
  initialState.user.balance = 45.5;
  initialState.user.totalEarned = 127.5;
  initialState.user.totalPaidOut = 80.0;
  initialState.user.pendingPayouts = 0;
  await saveState(initialState);
}
