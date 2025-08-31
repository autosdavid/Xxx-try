// AutoHandel Pro - Main Application Logic
class AutoHandelApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.init();
    }

    // KV Storage helper with localStorage fallback
    async kvGet(key) {
        try {
            if (window.kv) {
                return await window.kv.get(key);
            } else {
                const stored = localStorage.getItem(`kv_${key}`);
                return stored ? JSON.parse(stored) : null;
            }
        } catch (error) {
            const stored = localStorage.getItem(`kv_${key}`);
            return stored ? JSON.parse(stored) : null;
        }
    }

    async kvSet(key, value) {
        try {
            if (window.kv) {
                await window.kv.set(key, value);
            } else {
                localStorage.setItem(`kv_${key}`, JSON.stringify(value));
            }
        } catch (error) {
            localStorage.setItem(`kv_${key}`, JSON.stringify(value));
        }
    }

    async kvDelete(key) {
        try {
            if (window.kv) {
                await window.kv.delete(key);
            } else {
                localStorage.removeItem(`kv_${key}`);
            }
        } catch (error) {
            localStorage.removeItem(`kv_${key}`);
        }
    }

    async init() {
        this.setupEventListeners();
        await this.checkExistingSession();
    }

    async checkExistingSession() {
        try {
            const savedUser = await this.kvGet('currentUser');
            if (savedUser) {
                this.currentUser = savedUser;
                this.showMainApp();
                this.showPage('dashboard');
            }
        } catch (error) {
            console.log('No existing session found');
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Notifications
        document.getElementById('notificationBtn').addEventListener('click', () => {
            this.showNotifications();
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (!username || !password || !role) {
            this.showToast('Vul alle velden in', 'error');
            return;
        }

        // Simple authentication (in real app, this would be server-side)
        const user = {
            username,
            role,
            loginTime: new Date().toISOString()
        };

        this.currentUser = user;
        await this.kvSet('currentUser', user);
        
        this.showToast('Succesvol ingelogd', 'success');
        this.showMainApp();
        this.showPage('dashboard');
    }

    async handleLogout() {
        this.currentUser = null;
        await this.kvDelete('currentUser');
        this.showLoginPage();
        this.showToast('Uitgelogd', 'info');
    }

    showMainApp() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('userRole').textContent = this.currentUser.role;
        this.updateNavigation();
    }

    showLoginPage() {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('loginForm').reset();
    }

    updateNavigation() {
        // Show/hide navigation items based on user role
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.dataset.page;
            item.style.display = this.hasAccess(page) ? 'flex' : 'none';
        });
    }

    hasAccess(page) {
        const role = this.currentUser.role;
        const permissions = {
            admin: ['dashboard', 'wagens', 'personeel', 'documenten', 'financien', 'meldingen', 'zoeken'],
            verkoper: ['dashboard', 'wagens', 'documenten', 'zoeken'],
            administratie: ['dashboard', 'documenten', 'financien', 'meldingen'],
            personeel: ['dashboard', 'personeel']
        };
        return permissions[role]?.includes(page) || false;
    }

    showPage(page) {
        if (!this.hasAccess(page)) {
            this.showToast('Geen toegang tot deze pagina', 'error');
            return;
        }

        this.currentPage = page;
        
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('border-white');
            if (item.dataset.page === page) {
                item.classList.add('border-white');
            }
        });

        // Load page content
        this.loadPageContent(page);
    }

    async loadPageContent(page) {
        const content = document.getElementById('pageContent');
        
        switch (page) {
            case 'dashboard':
                content.innerHTML = await this.getDashboardContent();
                this.initDashboard();
                break;
            case 'wagens':
                content.innerHTML = await this.getWagensContent();
                this.initWagens();
                break;
            case 'personeel':
                content.innerHTML = await this.getPersoneelContent();
                this.initPersoneel();
                break;
            case 'documenten':
                content.innerHTML = await this.getDocumentenContent();
                this.initDocumenten();
                break;
            case 'financien':
                content.innerHTML = await this.getFinancienContent();
                this.initFinancien();
                break;
            case 'meldingen':
                content.innerHTML = await this.getMeldingenContent();
                this.initMeldingen();
                break;
            case 'zoeken':
                content.innerHTML = await this.getZoekenContent();
                this.initZoeken();
                break;
            default:
                content.innerHTML = '<p>Pagina niet gevonden</p>';
        }
    }

    async getDashboardContent() {
        const alerts = await this.getAlerts();
        const recentActivities = await this.getRecentActivities();
        
        return `
            <div class="space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <div class="mt-4 lg:mt-0">
                        <span class="text-sm text-gray-500">Welkom, ${this.currentUser.username}</span>
                    </div>
                </div>

                <!-- Alerts -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-red-600"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">Keuringen vereist</h3>
                                <p class="text-sm text-red-700">${alerts.keuringen} wagens</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-file-alt text-yellow-600"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-yellow-800">Documenten ontbreken</h3>
                                <p class="text-sm text-yellow-700">${alerts.documenten} items</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-euro-sign text-blue-600"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-blue-800">Openstaande betalingen</h3>
                                <p class="text-sm text-blue-700">€${alerts.betalingen.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-car text-green-600"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-green-800">Wagens in stock</h3>
                                <p class="text-sm text-green-700">${alerts.stock} stuks</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Snelle acties</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button class="quick-action-btn flex flex-col items-center p-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition" data-action="nieuwe-wagen">
                            <i class="fas fa-plus-circle text-2xl mb-2"></i>
                            <span class="text-sm">Nieuwe wagen</span>
                        </button>
                        <button class="quick-action-btn flex flex-col items-center p-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition" data-action="nieuw-personeelslid">
                            <i class="fas fa-user-plus text-2xl mb-2"></i>
                            <span class="text-sm">Nieuw personeelslid</span>
                        </button>
                        <button class="quick-action-btn flex flex-col items-center p-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition" data-action="upload-document">
                            <i class="fas fa-upload text-2xl mb-2"></i>
                            <span class="text-sm">Upload document</span>
                        </button>
                        <button class="quick-action-btn flex flex-col items-center p-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition" data-action="nieuwe-herinnering">
                            <i class="fas fa-bell text-2xl mb-2"></i>
                            <span class="text-sm">Nieuwe herinnering</span>
                        </button>
                    </div>
                </div>

                <!-- Recent Activities -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Recente activiteiten</h2>
                    <div class="space-y-4">
                        ${recentActivities.map(activity => `
                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0">
                                    <i class="fas ${activity.icon} text-gray-400"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm text-gray-900">${activity.description}</p>
                                    <p class="text-xs text-gray-500">${activity.time}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    async getAlerts() {
        // Get alerts from storage or return default values
        const storedAlerts = await this.kvGet('dashboard_alerts') || {};
        return {
            keuringen: storedAlerts.keuringen || 3,
            documenten: storedAlerts.documenten || 7,
            betalingen: storedAlerts.betalingen || 15750,
            stock: storedAlerts.stock || 42
        };
    }

    async getRecentActivities() {
        const activities = await this.kvGet('recent_activities') || [];
        return activities.length > 0 ? activities : [
            {
                icon: 'fa-car',
                description: 'Nieuwe wagen toegevoegd: BMW 320d',
                time: '2 uur geleden'
            },
            {
                icon: 'fa-file-alt',
                description: 'Document geüpload voor Mercedes A180',
                time: '4 uur geleden'
            },
            {
                icon: 'fa-euro-sign',
                description: 'Betaling ontvangen van klant Johnson',
                time: '1 dag geleden'
            }
        ];
    }

    initDashboard() {
        // Add event listeners for quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'nieuwe-wagen':
                this.showPage('wagens');
                setTimeout(() => this.showWagenForm(), 100);
                break;
            case 'nieuw-personeelslid':
                this.showPage('personeel');
                setTimeout(() => this.showPersoneelForm(), 100);
                break;
            case 'upload-document':
                this.showPage('documenten');
                break;
            case 'nieuwe-herinnering':
                this.showPage('meldingen');
                break;
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        // Update toast styling based on type
        const toastDiv = toast.querySelector('div');
        toastDiv.className = `px-6 py-3 rounded-lg shadow-lg flex items-center ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'info' ? 'bg-blue-500 text-white' :
            'bg-gray-500 text-white'
        }`;
        
        const icon = toast.querySelector('i');
        icon.className = `mr-2 ${
            type === 'success' ? 'fas fa-check-circle' :
            type === 'error' ? 'fas fa-exclamation-circle' :
            type === 'info' ? 'fas fa-info-circle' :
            'fas fa-bell'
        }`;
        
        toastMessage.textContent = message;
        
        // Show toast
        toast.classList.remove('translate-y-full');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-full');
        }, 3000);
    }

    showNotifications() {
        // Toggle notification badge
        const badge = document.getElementById('notificationBadge');
        badge.classList.add('hidden');
        
        // Show notifications modal (placeholder)
        this.showToast('Meldingen weergegeven', 'info');
    }

    // Personeel module implementation
    async getPersoneelContent() {
        const medewerkers = await this.getMedewerkers();
        
        return `
            <div class="space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Personeelsbeheer</h1>
                    <button id="nieuwPersoneelBtn" class="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nieuw personeelslid
                    </button>
                </div>

                <!-- Personeel overzicht -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-lg font-medium text-gray-900">Medewerkers overzicht</h2>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Functie</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Startdatum</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documenten</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${medewerkers.map(medewerker => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                                                    <span class="text-white font-medium">${medewerker.naam.charAt(0)}</span>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">${medewerker.naam}</div>
                                                    <div class="text-sm text-gray-500">${medewerker.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${medewerker.functie}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${medewerker.startdatum}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                medewerker.status === 'actief' ? 'bg-green-100 text-green-800' :
                                                medewerker.status === 'verlof' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }">
                                                ${medewerker.status}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex space-x-2">
                                                ${medewerker.documenten.map(doc => `
                                                    <span class="inline-flex items-center px-2 py-1 text-xs rounded ${
                                                        doc.status === 'compleet' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }">
                                                        <i class="fas ${doc.status === 'compleet' ? 'fa-check' : 'fa-times'} mr-1"></i>
                                                        ${doc.type}
                                                    </span>
                                                `).join('')}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button class="text-primary hover:text-blue-700 mr-3 edit-medewerker" data-id="${medewerker.id}">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="text-red-600 hover:text-red-700 delete-medewerker" data-id="${medewerker.id}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Personeel formulier modal -->
            <div id="personeelModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900" id="personeelModalTitle">Nieuw personeelslid</h3>
                            <button id="closePersoneelModal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form id="personeelForm" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Voornaam</label>
                                    <input type="text" name="voornaam" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Achternaam</label>
                                    <input type="text" name="achternaam" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                                    <input type="tel" name="telefoon" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Functie</label>
                                    <select name="functie" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                        <option value="">Selecteer functie</option>
                                        <option value="Verkoper">Verkoper</option>
                                        <option value="Administratie">Administratie</option>
                                        <option value="Technicus">Technicus</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                                    <input type="date" name="startdatum" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                                <textarea name="adres" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"></textarea>
                            </div>

                            <!-- Documenten checklist -->
                            <div class="border-t pt-4">
                                <h4 class="text-sm font-medium text-gray-900 mb-3">Documenten checklist</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <label class="flex items-center">
                                        <input type="checkbox" name="doc_contract" class="rounded border-gray-300 text-primary focus:ring-primary">
                                        <span class="ml-2 text-sm text-gray-700">Contract</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" name="doc_cv" class="rounded border-gray-300 text-primary focus:ring-primary">
                                        <span class="ml-2 text-sm text-gray-700">CV</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" name="doc_identiteit" class="rounded border-gray-300 text-primary focus:ring-primary">
                                        <span class="ml-2 text-sm text-gray-700">Identiteitsbewijs</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" name="doc_diploma" class="rounded border-gray-300 text-primary focus:ring-primary">
                                        <span class="ml-2 text-sm text-gray-700">Diploma's</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" id="cancelPersoneelForm" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Annuleren
                                </button>
                                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-blue-700">
                                    Opslaan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async getMedewerkers() {
        const medewerkers = await this.kvGet('medewerkers') || [];
        return medewerkers.length > 0 ? medewerkers : [
            {
                id: 1,
                naam: 'Jan Janssen',
                email: 'jan@autohandel.nl',
                functie: 'Verkoper',
                startdatum: '2023-01-15',
                status: 'actief',
                documenten: [
                    { type: 'Contract', status: 'compleet' },
                    { type: 'CV', status: 'compleet' },
                    { type: 'ID', status: 'ontbreekt' }
                ]
            },
            {
                id: 2,
                naam: 'Marie Pieters',
                email: 'marie@autohandel.nl',
                functie: 'Administratie',
                startdatum: '2023-03-01',
                status: 'verlof',
                documenten: [
                    { type: 'Contract', status: 'compleet' },
                    { type: 'CV', status: 'compleet' },
                    { type: 'ID', status: 'compleet' }
                ]
            }
        ];
    }

    // Wagens module implementation
    async getWagensContent() {
        const wagens = await this.getWagens();
        
        return `
            <div class="space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Wagenbeheer</h1>
                    <button id="nieuweWagenBtn" class="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nieuwe wagen
                    </button>
                </div>

                <!-- Filter bar -->
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="statusFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle statussen</option>
                                <option value="stock">In stock</option>
                                <option value="consignatie">Consignatie</option>
                                <option value="verkocht">Verkocht</option>
                                <option value="onderhoud">In onderhoud</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Keuringsstatus</label>
                            <select id="keuringFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle keuringen</option>
                                <option value="groen">Goedgekeurd</option>
                                <option value="oranje">Herkeuring</option>
                                <option value="rood">Keuring vereist</option>
                                <option value="zwart">Niet keuren</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select id="typeFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle types</option>
                                <option value="personenwagen">Personenwagen</option>
                                <option value="oldtimer">Oldtimer</option>
                                <option value="lichte_vracht">Lichte vracht</option>
                            </select>
                        </div>
                        <div>
                            <input type="text" id="searchWagen" placeholder="Zoek op merk, model, chassisnummer..." 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                        </div>
                    </div>
                </div>

                <!-- Wagens overzicht -->
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="wagensGrid">
                    ${wagens.map(wagen => `
                        <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer wagen-card" data-id="${wagen.id}">
                            <div class="relative">
                                ${wagen.afbeelding ? `
                                    <img src="${wagen.afbeelding}" alt="${wagen.merk} ${wagen.model}" class="w-full h-48 object-cover rounded-t-lg">
                                ` : `
                                    <div class="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                                        <i class="fas fa-car text-gray-400 text-4xl"></i>
                                    </div>
                                `}
                                
                                <!-- Status badges -->
                                <div class="absolute top-2 left-2 flex flex-col space-y-1">
                                    <span class="px-2 py-1 text-xs font-semibold rounded ${
                                        wagen.status === 'stock' ? 'bg-green-100 text-green-800' :
                                        wagen.status === 'consignatie' ? 'bg-blue-100 text-blue-800' :
                                        wagen.status === 'verkocht' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }">
                                        ${wagen.status}
                                    </span>
                                    ${wagen.oldtimer ? '<span class="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">Oldtimer</span>' : ''}
                                    ${wagen.lichte_vracht ? '<span class="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">Lichte vracht</span>' : ''}
                                </div>

                                <!-- Keuringsstatus -->
                                <div class="absolute top-2 right-2">
                                    <div class="w-4 h-4 rounded-full ${
                                        wagen.keuringsstatus === 'groen' ? 'bg-green-500' :
                                        wagen.keuringsstatus === 'oranje' ? 'bg-orange-500' :
                                        wagen.keuringsstatus === 'rood' ? 'bg-red-500' :
                                        'bg-gray-900'
                                    }" title="Keuringsstatus: ${wagen.keuringsstatus}"></div>
                                </div>
                            </div>
                            
                            <div class="p-4">
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="text-lg font-semibold text-gray-900">${wagen.merk} ${wagen.model}</h3>
                                    <span class="text-lg font-bold text-primary">€${wagen.verkoopprijs?.toLocaleString() || '-'}</span>
                                </div>
                                
                                <div class="space-y-1 text-sm text-gray-600">
                                    <div class="flex justify-between">
                                        <span>Stocknummer:</span>
                                        <span class="font-medium">${wagen.stocknummer}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Bouwjaar:</span>
                                        <span>${wagen.bouwjaar}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Km-stand:</span>
                                        <span>${wagen.kmstand?.toLocaleString()} km</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Brandstof:</span>
                                        <span>${wagen.brandstof}</span>
                                    </div>
                                </div>

                                <!-- Progress indicators -->
                                <div class="mt-3 pt-3 border-t border-gray-200">
                                    <div class="flex justify-between items-center text-xs">
                                        <span class="text-gray-500">Documenten:</span>
                                        <div class="flex space-x-1">
                                            ${['aankoop', 'verkoop', 'garantie'].map(type => `
                                                <div class="w-2 h-2 rounded-full ${
                                                    wagen.documenten?.[type]?.compleet ? 'bg-green-500' : 'bg-red-500'
                                                }" title="${type} ${wagen.documenten?.[type]?.compleet ? 'compleet' : 'incompleet'}"></div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="mt-3 flex justify-between">
                                    <button class="edit-wagen text-primary hover:text-blue-700" data-id="${wagen.id}">
                                        <i class="fas fa-edit mr-1"></i>
                                        Bewerken
                                    </button>
                                    <button class="delete-wagen text-red-600 hover:text-red-700" data-id="${wagen.id}">
                                        <i class="fas fa-trash mr-1"></i>
                                        Verwijderen
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Wagen formulier modal -->
            <div id="wagenModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
                <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900" id="wagenModalTitle">Nieuwe wagen</h3>
                            <button id="closeWagenModal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form id="wagenForm" class="space-y-6">
                            <!-- Basisgegevens -->
                            <div class="border-b pb-6">
                                <h4 class="text-md font-medium text-gray-900 mb-4">Basisgegevens</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Merk</label>
                                        <input type="text" name="merk" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                        <input type="text" name="model" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Stocknummer</label>
                                        <input type="text" name="stocknummer" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Chassisnummer</label>
                                        <input type="text" name="chassisnummer" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Nummerplaat</label>
                                        <input type="text" name="nummerplaat" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Eerste inschrijving</label>
                                        <input type="date" name="eerste_inschrijving" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Bouwjaar</label>
                                        <input type="number" name="bouwjaar" min="1950" max="2025" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Kleur</label>
                                        <input type="text" name="kleur" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Km-stand</label>
                                        <input type="number" name="kmstand" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Brandstof</label>
                                        <select name="brandstof" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                            <option value="">Selecteer brandstof</option>
                                            <option value="Benzine">Benzine</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Elektrisch">Elektrisch</option>
                                            <option value="Hybride">Hybride</option>
                                            <option value="LPG">LPG</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Transmissie</label>
                                        <select name="transmissie" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                            <option value="">Selecteer transmissie</option>
                                            <option value="Handgeschakeld">Handgeschakeld</option>
                                            <option value="Automaat">Automaat</option>
                                            <option value="Semi-automaat">Semi-automaat</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Vermogen (kW)</label>
                                        <input type="number" name="vermogen" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                </div>
                                
                                <!-- Extra kenmerken -->
                                <div class="mt-4">
                                    <h5 class="text-sm font-medium text-gray-900 mb-2">Extra kenmerken</h5>
                                    <div class="space-y-2">
                                        <label class="flex items-center">
                                            <input type="checkbox" name="oldtimer" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Oldtimer</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="lichte_vracht" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Lichte vracht / kleine nummerplaat</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Status en workflow -->
                            <div class="border-b pb-6">
                                <h4 class="text-md font-medium text-gray-900 mb-4">Status & Workflow</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                            <option value="stock">In stock</option>
                                            <option value="consignatie">Consignatie</option>
                                            <option value="verkocht">Verkocht</option>
                                            <option value="onderhoud">In onderhoud</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Keuringsstatus</label>
                                        <select name="keuringsstatus" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                            <option value="groen">Goedgekeurd (groen)</option>
                                            <option value="oranje">Herkeuring vereist (oranje)</option>
                                            <option value="rood">Keuring vereist (rood)</option>
                                            <option value="zwart">Niet keuren (zwart)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Type werkzaamheden</label>
                                        <select name="werkzaamheden" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                            <option value="">Geen</option>
                                            <option value="intake">Intake</option>
                                            <option value="poetsbeurt">Poetsbeurt</option>
                                            <option value="klein_onderhoud">Klein onderhoud</option>
                                            <option value="groot_onderhoud">Groot onderhoud</option>
                                            <option value="reparatie">Reparatie</option>
                                            <option value="keuring">Keuring</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Financiën -->
                            <div class="border-b pb-6">
                                <h4 class="text-md font-medium text-gray-900 mb-4">Financiën</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Inkoopprijs (€)</label>
                                        <input type="number" name="inkoopprijs" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Verkoopprijs (€)</label>
                                        <input type="number" name="verkoopprijs" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Geschatte winst (€)</label>
                                        <input type="number" name="winst" step="0.01" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                    </div>
                                </div>
                            </div>

                            <!-- Documenten checklists -->
                            <div>
                                <h4 class="text-md font-medium text-gray-900 mb-4">Documenten checklists</h4>
                                
                                <!-- Aankoop documenten -->
                                <div class="mb-4">
                                    <h5 class="text-sm font-medium text-gray-700 mb-2">Aankoop documenten</h5>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_aankoopbordel" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Aankoopbordel</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_marge_attest" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Marge-attest</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_factuur" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Factuur</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_inschrijving_1" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Inschrijvingsbewijs deel 1</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_inschrijving_2" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Inschrijvingsbewijs deel 2</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_coc" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">CoC</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Verkoop documenten -->
                                <div class="mb-4">
                                    <h5 class="text-sm font-medium text-gray-700 mb-2">Verkoop documenten</h5>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_verkoopcontract" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Verkoopcontract</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_overdracht" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Overdrachtsformulier</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_betaling" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Betalingsbewijs</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Garantie documenten -->
                                <div>
                                    <h5 class="text-sm font-medium text-gray-700 mb-2">Garantie documenten</h5>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_garantie_contract" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Garantiecontract</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_garantie_voorwaarden" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Garantievoorwaarden</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="checkbox" name="doc_onderhoudsboek" class="rounded border-gray-300 text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Onderhoudsboek</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" id="cancelWagenForm" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Annuleren
                                </button>
                                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-blue-700">
                                    Opslaan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async getWagens() {
        const wagens = await this.kvGet('wagens') || [];
        return wagens.length > 0 ? wagens : [
            {
                id: 1,
                merk: 'BMW',
                model: '320d',
                stocknummer: 'BMW001',
                chassisnummer: 'WBAVA31070PT09876',
                nummerplaat: '1-ABC-123',
                bouwjaar: 2020,
                kleur: 'Zwart',
                kmstand: 45000,
                brandstof: 'Diesel',
                transmissie: 'Automaat',
                vermogen: 140,
                status: 'stock',
                keuringsstatus: 'groen',
                inkoopprijs: 25000,
                verkoopprijs: 32000,
                oldtimer: false,
                lichte_vracht: false,
                documenten: {
                    aankoop: { compleet: true },
                    verkoop: { compleet: false },
                    garantie: { compleet: true }
                }
            },
            {
                id: 2,
                merk: 'Mercedes',
                model: 'A180',
                stocknummer: 'MER001',
                chassisnummer: 'WDD1760291J123456',
                nummerplaat: '2-DEF-456',
                bouwjaar: 2019,
                kleur: 'Wit',
                kmstand: 32000,
                brandstof: 'Benzine',
                transmissie: 'Handgeschakeld',
                vermogen: 100,
                status: 'consignatie',
                keuringsstatus: 'rood',
                inkoopprijs: 22000,
                verkoopprijs: 28000,
                oldtimer: false,
                lichte_vracht: false,
                documenten: {
                    aankoop: { compleet: false },
                    verkoop: { compleet: false },
                    garantie: { compleet: false }
                }
            }
        ];
    }
    async getDocumentenContent() {
        const documenten = await this.getDocumenten();
        
        return `
            <div class="space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Documentenbeheer</h1>
                    <button id="uploadDocumentBtn" class="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-upload mr-2"></i>
                        Document uploaden
                    </button>
                </div>

                <!-- Document stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-file-alt text-blue-600 text-2xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Totaal documenten</p>
                                <p class="text-2xl font-semibold text-gray-900">${documenten.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Ontbrekende documenten</p>
                                <p class="text-2xl font-semibold text-gray-900">${documenten.filter(d => d.status === 'ontbreekt').length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-clock text-yellow-600 text-2xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Verlopen documenten</p>
                                <p class="text-2xl font-semibold text-gray-900">${documenten.filter(d => d.vervaldatum && new Date(d.vervaldatum) < new Date()).length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-search text-green-600 text-2xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">OCR verwerkt</p>
                                <p class="text-2xl font-semibold text-gray-900">${documenten.filter(d => d.ocr_verwerkt).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Document filters -->
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                            <select id="documentCategorieFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle categorieën</option>
                                <option value="wagen">Wagen documenten</option>
                                <option value="personeel">Personeel documenten</option>
                                <option value="financieel">Financiële documenten</option>
                                <option value="juridisch">Juridische documenten</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="documentStatusFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle statussen</option>
                                <option value="compleet">Compleet</option>
                                <option value="ontbreekt">Ontbreekt</option>
                                <option value="verlopen">Verlopen</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select id="documentTypeFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle types</option>
                                <option value="contract">Contract</option>
                                <option value="factuur">Factuur</option>
                                <option value="inschrijving">Inschrijvingsbewijs</option>
                                <option value="keuring">Keuring</option>
                                <option value="garantie">Garantie</option>
                                <option value="identiteit">Identiteitsbewijs</option>
                            </select>
                        </div>
                        <div>
                            <input type="text" id="documentSearch" placeholder="Zoek documenten..." 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                        </div>
                    </div>
                </div>

                <!-- Documents list -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-lg font-medium text-gray-900">Documenten overzicht</h2>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerelateerd aan</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vervaldatum</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${documenten.map(document => `
                                    <tr class="document-row" data-categorie="${document.categorie}" data-status="${document.status}" data-type="${document.type}">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0">
                                                    <i class="fas ${this.getDocumentIcon(document.type)} text-gray-400"></i>
                                                </div>
                                                <div class="ml-3">
                                                    <div class="text-sm font-medium text-gray-900">${document.naam}</div>
                                                    <div class="text-sm text-gray-500">Geüpload: ${document.upload_datum}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${document.type}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                document.categorie === 'wagen' ? 'bg-blue-100 text-blue-800' :
                                                document.categorie === 'personeel' ? 'bg-green-100 text-green-800' :
                                                document.categorie === 'financieel' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-purple-100 text-purple-800'
                                            }">
                                                ${document.categorie}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${document.gerelateerd_aan}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${document.vervaldatum || '-'}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                document.status === 'compleet' ? 'bg-green-100 text-green-800' :
                                                document.status === 'ontbreekt' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }">
                                                ${document.status}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div class="flex space-x-2">
                                                <button class="text-primary hover:text-blue-700 view-document" data-id="${document.id}">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="text-green-600 hover:text-green-700 download-document" data-id="${document.id}">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                                <button class="text-yellow-600 hover:text-yellow-700 edit-document" data-id="${document.id}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="text-red-600 hover:text-red-700 delete-document" data-id="${document.id}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Upload document modal -->
            <div id="uploadModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Document uploaden</h3>
                            <button id="closeUploadModal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form id="uploadForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Document</label>
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" class="hidden">
                                    <i class="fas fa-cloud-upload-alt text-gray-400 text-3xl mb-2"></i>
                                    <p class="text-sm text-gray-600">Klik om een bestand te selecteren of sleep het hierheen</p>
                                    <p class="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC, DOCX (max 10MB)</p>
                                </div>
                                <div id="filePreview" class="mt-2 hidden">
                                    <div class="flex items-center p-2 bg-gray-50 rounded">
                                        <i class="fas fa-file text-gray-400 mr-2"></i>
                                        <span id="fileName" class="text-sm text-gray-700"></span>
                                        <button type="button" id="removeFile" class="ml-auto text-red-600 hover:text-red-700">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                                    <input type="text" name="naam" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                        <option value="">Selecteer type</option>
                                        <option value="contract">Contract</option>
                                        <option value="factuur">Factuur</option>
                                        <option value="inschrijving">Inschrijvingsbewijs</option>
                                        <option value="keuring">Keuring</option>
                                        <option value="garantie">Garantie</option>
                                        <option value="identiteit">Identiteitsbewijs</option>
                                        <option value="cv">CV</option>
                                        <option value="diploma">Diploma</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                                    <select name="categorie" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                        <option value="">Selecteer categorie</option>
                                        <option value="wagen">Wagen documenten</option>
                                        <option value="personeel">Personeel documenten</option>
                                        <option value="financieel">Financiële documenten</option>
                                        <option value="juridisch">Juridische documenten</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Gerelateerd aan</label>
                                    <input type="text" name="gerelateerd_aan" placeholder="Bijv. BMW 320d, Jan Janssen, etc." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Vervaldatum (optioneel)</label>
                                    <input type="date" name="vervaldatum" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="flex items-center mt-6">
                                        <input type="checkbox" name="ocr_verwerken" class="rounded border-gray-300 text-primary focus:ring-primary">
                                        <span class="ml-2 text-sm text-gray-700">OCR verwerking toepassen</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" id="cancelUpload" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Annuleren
                                </button>
                                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-blue-700">
                                    Uploaden
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async getDocumenten() {
        const documenten = await this.kvGet('documenten') || [];
        return documenten.length > 0 ? documenten : [
            {
                id: 1,
                naam: 'BMW 320d Inschrijvingsbewijs deel 1',
                type: 'inschrijving',
                categorie: 'wagen',
                gerelateerd_aan: 'BMW 320d (BMW001)',
                upload_datum: '2024-12-15',
                vervaldatum: null,
                status: 'compleet',
                ocr_verwerkt: true,
                bestandsgrootte: '2.4 MB',
                bestandstype: 'PDF'
            },
            {
                id: 2,
                naam: 'Jan Janssen Contract',
                type: 'contract',
                categorie: 'personeel',
                gerelateerd_aan: 'Jan Janssen',
                upload_datum: '2024-01-15',
                vervaldatum: '2025-01-15',
                status: 'compleet',
                ocr_verwerkt: true,
                bestandsgrootte: '1.8 MB',
                bestandstype: 'PDF'
            },
            {
                id: 3,
                naam: 'Mercedes A180 Aankoopbordel',
                type: 'contract',
                categorie: 'wagen',
                gerelateerd_aan: 'Mercedes A180 (MER001)',
                upload_datum: null,
                vervaldatum: null,
                status: 'ontbreekt',
                ocr_verwerkt: false,
                bestandsgrootte: null,
                bestandstype: null
            }
        ];
    }

    getDocumentIcon(type) {
        const icons = {
            contract: 'fa-file-contract',
            factuur: 'fa-file-invoice',
            inschrijving: 'fa-id-card',
            keuring: 'fa-clipboard-check',
            garantie: 'fa-shield-alt',
            identiteit: 'fa-id-badge',
            cv: 'fa-file-alt',
            diploma: 'fa-graduation-cap'
        };
        return icons[type] || 'fa-file';
    }
    async getFinancienContent() {
        const financieleData = await this.getFinancieleData();
        
        return `
            <div class="space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Financiële module</h1>
                    <div class="mt-4 lg:mt-0 flex space-x-2">
                        <button id="exportFinancienBtn" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-download mr-2"></i>
                            Export
                        </button>
                        <button id="nieuweTransactieBtn" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-plus mr-2"></i>
                            Nieuwe transactie
                        </button>
                    </div>
                </div>

                <!-- Financial overview cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-up text-green-600"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Totale omzet</p>
                                <p class="text-2xl font-semibold text-gray-900">€${financieleData.totaleOmzet.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-chart-line text-blue-600"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Totale winst</p>
                                <p class="text-2xl font-semibold text-gray-900">€${financieleData.totaleWinst.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-down text-red-600"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Totale kosten</p>
                                <p class="text-2xl font-semibold text-gray-900">€${financieleData.totaleKosten.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-clock text-yellow-600"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Openstaand</p>
                                <p class="text-2xl font-semibold text-gray-900">€${financieleData.openstaandeBedragen.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="bg-white rounded-lg shadow">
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex space-x-8 px-6">
                            <button class="financie-tab py-4 px-1 border-b-2 border-primary text-primary font-medium text-sm" data-tab="winst-marge">
                                Winst & Marge
                            </button>
                            <button class="financie-tab py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm" data-tab="kosten">
                                Kosten
                            </button>
                            <button class="financie-tab py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm" data-tab="openstaand">
                                Openstaande bedragen
                            </button>
                            <button class="financie-tab py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm" data-tab="dagvaardingen">
                                Dagvaardingen
                            </button>
                        </nav>
                    </div>
                    
                    <div class="p-6">
                        <!-- Winst & Marge Tab -->
                        <div id="winst-marge-content" class="financie-content">
                            <div class="space-y-6">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-medium text-gray-900">Winst & Marge overzicht</h3>
                                    <div class="flex space-x-2">
                                        <select id="periodeFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                            <option value="month">Deze maand</option>
                                            <option value="quarter">Dit kwartaal</option>
                                            <option value="year">Dit jaar</option>
                                            <option value="all">Alle tijd</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <!-- Chart container -->
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <canvas id="winstChart" width="400" height="200"></canvas>
                                </div>
                                
                                <!-- Wagen winst table -->
                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wagen</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inkoopprijs</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verkoopprijs</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winst</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marge %</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            ${financieleData.wagenWinsten.map(wagen => {
                                                const winst = (wagen.verkoopprijs || 0) - (wagen.inkoopprijs || 0);
                                                const marge = wagen.inkoopprijs ? ((winst / wagen.inkoopprijs) * 100).toFixed(1) : 0;
                                                return `
                                                    <tr>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            ${wagen.merk} ${wagen.model}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            €${(wagen.inkoopprijs || 0).toLocaleString()}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            €${(wagen.verkoopprijs || 0).toLocaleString()}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${winst >= 0 ? 'text-green-600' : 'text-red-600'}">
                                                            €${winst.toLocaleString()}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            ${marge}%
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap">
                                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                wagen.status === 'verkocht' ? 'bg-green-100 text-green-800' :
                                                                wagen.status === 'stock' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }">
                                                                ${wagen.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Kosten Tab -->
                        <div id="kosten-content" class="financie-content hidden">
                            <div class="space-y-6">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-medium text-gray-900">Kosten overzicht</h3>
                                    <button id="nieuweKostBtn" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                                        <i class="fas fa-plus mr-2"></i>
                                        Nieuwe kost
                                    </button>
                                </div>
                                
                                <!-- Kosten categories -->
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div class="bg-blue-50 rounded-lg p-4">
                                        <h4 class="text-sm font-medium text-blue-900">Inkoop</h4>
                                        <p class="text-2xl font-bold text-blue-600">€${financieleData.kostenCategorieen.inkoop.toLocaleString()}</p>
                                    </div>
                                    <div class="bg-green-50 rounded-lg p-4">
                                        <h4 class="text-sm font-medium text-green-900">Onderhoud</h4>
                                        <p class="text-2xl font-bold text-green-600">€${financieleData.kostenCategorieen.onderhoud.toLocaleString()}</p>
                                    </div>
                                    <div class="bg-yellow-50 rounded-lg p-4">
                                        <h4 class="text-sm font-medium text-yellow-900">Administratie</h4>
                                        <p class="text-2xl font-bold text-yellow-600">€${financieleData.kostenCategorieen.administratie.toLocaleString()}</p>
                                    </div>
                                    <div class="bg-red-50 rounded-lg p-4">
                                        <h4 class="text-sm font-medium text-red-900">Juridisch</h4>
                                        <p class="text-2xl font-bold text-red-600">€${financieleData.kostenCategorieen.juridisch.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <!-- Recent expenses -->
                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wagen</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            ${financieleData.recenteKosten.map(kost => `
                                                <tr>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${kost.datum}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${kost.beschrijving}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            kost.categorie === 'inkoop' ? 'bg-blue-100 text-blue-800' :
                                                            kost.categorie === 'onderhoud' ? 'bg-green-100 text-green-800' :
                                                            kost.categorie === 'administratie' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }">
                                                            ${kost.categorie}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                                        -€${kost.bedrag.toLocaleString()}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${kost.wagen || '-'}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button class="text-primary hover:text-blue-700 mr-3">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="text-red-600 hover:text-red-700">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Openstaande bedragen Tab -->
                        <div id="openstaand-content" class="financie-content hidden">
                            <div class="space-y-6">
                                <h3 class="text-lg font-medium text-gray-900">Openstaande betalingen</h3>
                                
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div class="space-y-4">
                                        ${financieleData.openstaandeBetalingen.map(betaling => `
                                            <div class="bg-white border rounded-lg p-4 ${
                                                betaling.dagen_over_tijd > 30 ? 'border-red-300 bg-red-50' :
                                                betaling.dagen_over_tijd > 14 ? 'border-yellow-300 bg-yellow-50' :
                                                'border-gray-300'
                                            }">
                                                <div class="flex justify-between items-start">
                                                    <div>
                                                        <h4 class="font-medium text-gray-900">${betaling.klant}</h4>
                                                        <p class="text-sm text-gray-500">${betaling.factuur_nummer}</p>
                                                        <p class="text-sm text-gray-500">Vervaldatum: ${betaling.vervaldatum}</p>
                                                    </div>
                                                    <div class="text-right">
                                                        <p class="text-lg font-bold text-red-600">€${betaling.bedrag.toLocaleString()}</p>
                                                        <p class="text-xs text-gray-500">${betaling.dagen_over_tijd} dagen over tijd</p>
                                                    </div>
                                                </div>
                                                <div class="mt-3 flex space-x-2">
                                                    <button class="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                                                        Herinnering versturen
                                                    </button>
                                                    <button class="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">
                                                        Markeer als betaald
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <!-- Summary -->
                                    <div class="bg-gray-50 rounded-lg p-6">
                                        <h4 class="font-medium text-gray-900 mb-4">Samenvatting</h4>
                                        <div class="space-y-3">
                                            <div class="flex justify-between">
                                                <span class="text-sm text-gray-600">Totaal openstaand:</span>
                                                <span class="font-medium">€${financieleData.openstaandeBedragen.toLocaleString()}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-sm text-gray-600">Aantal facturen:</span>
                                                <span class="font-medium">${financieleData.openstaandeBetalingen.length}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-sm text-gray-600">Gemiddelde dagen over tijd:</span>
                                                <span class="font-medium">${Math.round(financieleData.openstaandeBetalingen.reduce((sum, b) => sum + b.dagen_over_tijd, 0) / financieleData.openstaandeBetalingen.length)} dagen</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Dagvaardingen Tab -->
                        <div id="dagvaardingen-content" class="financie-content hidden">
                            <div class="space-y-6">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-medium text-gray-900">Dagvaardingen & Juridische kosten</h3>
                                    <button id="nieuweDagvaardingBtn" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                                        <i class="fas fa-plus mr-2"></i>
                                        Nieuwe dagvaarding
                                    </button>
                                </div>
                                
                                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div class="flex">
                                        <i class="fas fa-exclamation-triangle text-yellow-600 mt-1"></i>
                                        <div class="ml-3">
                                            <h4 class="text-sm font-medium text-yellow-800">Belangrijk</h4>
                                            <p class="text-sm text-yellow-700">Juridische zaken vereisen zorgvuldige behandeling. Raadpleeg altijd een juridisch adviseur.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klant</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juridische kosten</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            ${financieleData.dagvaardingen.map(dagvaarding => `
                                                <tr>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${dagvaarding.datum}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${dagvaarding.klant}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">€${dagvaarding.bedrag.toLocaleString()}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            dagvaarding.status === 'opgelost' ? 'bg-green-100 text-green-800' :
                                                            dagvaarding.status === 'in_behandeling' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }">
                                                            ${dagvaarding.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€${dagvaarding.juridische_kosten.toLocaleString()}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button class="text-primary hover:text-blue-700 mr-3">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="text-primary hover:text-blue-700">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async getFinancieleData() {
        // Get financial data from storage or return default values
        const wagens = await this.kvGet('wagens') || [];
        const kosten = await this.kvGet('kosten') || [];
        
        const verkochteWagens = wagens.filter(w => w.status === 'verkocht');
        const totaleOmzet = verkochteWagens.reduce((sum, w) => sum + (w.verkoopprijs || 0), 0);
        const totaleInkoop = verkochteWagens.reduce((sum, w) => sum + (w.inkoopprijs || 0), 0);
        const totaleWinst = totaleOmzet - totaleInkoop;
        const totaleKosten = kosten.reduce((sum, k) => sum + k.bedrag, 0);
        
        return {
            totaleOmzet,
            totaleWinst,
            totaleKosten,
            openstaandeBedragen: 15750,
            wagenWinsten: wagens,
            kostenCategorieen: {
                inkoop: totaleInkoop,
                onderhoud: 5200,
                administratie: 1800,
                juridisch: 850
            },
            recenteKosten: [
                {
                    datum: '2024-12-15',
                    beschrijving: 'Banden vervangen',
                    categorie: 'onderhoud',
                    bedrag: 320,
                    wagen: 'BMW 320d'
                },
                {
                    datum: '2024-12-14',
                    beschrijving: 'Administratiekosten',
                    categorie: 'administratie',
                    bedrag: 150,
                    wagen: null
                }
            ],
            openstaandeBetalingen: [
                {
                    klant: 'Johnson B.V.',
                    factuur_nummer: 'F-2024-0123',
                    bedrag: 8500,
                    vervaldatum: '2024-12-01',
                    dagen_over_tijd: 25
                },
                {
                    klant: 'Smith Auto',
                    factuur_nummer: 'F-2024-0118',
                    bedrag: 4250,
                    vervaldatum: '2024-12-10',
                    dagen_over_tijd: 16
                },
                {
                    klant: 'Van Der Berg',
                    factuur_nummer: 'F-2024-0130',
                    bedrag: 3000,
                    vervaldatum: '2024-12-20',
                    dagen_over_tijd: 6
                }
            ],
            dagvaardingen: [
                {
                    datum: '2024-11-15',
                    klant: 'Probleem Klant B.V.',
                    bedrag: 12000,
                    status: 'in_behandeling',
                    juridische_kosten: 850
                }
            ]
        };
    }
    async getMeldingenContent() {
        const meldingen = await this.getMeldingen();
        
        return `
            <div class="space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Meldingen & Herinneringen</h1>
                    <button id="nieuweHerinneringBtn" class="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-plus mr-2"></i>
                        Nieuwe herinnering
                    </button>
                </div>

                <!-- Meldingen filters -->
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select id="meldingTypeFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle types</option>
                                <option value="keuring">Keuring</option>
                                <option value="documenten">Documenten</option>
                                <option value="betaling">Betalingen</option>
                                <option value="onderhoud">Onderhoud</option>
                                <option value="verlof">Verlof</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
                            <select id="prioriteitFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle prioriteiten</option>
                                <option value="hoog">Hoog</option>
                                <option value="normaal">Normaal</option>
                                <option value="laag">Laag</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="statusMeldingFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                <option value="">Alle statussen</option>
                                <option value="open">Open</option>
                                <option value="voltooid">Voltooid</option>
                                <option value="uitgesteld">Uitgesteld</option>
                            </select>
                        </div>
                        <div>
                            <button id="markeerAlleGelezenBtn" class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                                <i class="fas fa-check-double mr-2"></i>
                                Markeer alle als gelezen
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Urgente meldingen -->
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 class="text-lg font-medium text-red-900 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Urgente meldingen
                    </h2>
                    <div class="space-y-3">
                        ${meldingen.filter(m => m.prioriteit === 'hoog' && m.status === 'open').map(melding => `
                            <div class="bg-white border border-red-300 rounded-lg p-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-start space-x-3">
                                        <div class="flex-shrink-0">
                                            <i class="fas ${this.getMeldingIcon(melding.type)} text-red-600"></i>
                                        </div>
                                        <div>
                                            <h4 class="text-sm font-medium text-gray-900">${melding.titel}</h4>
                                            <p class="text-sm text-gray-600">${melding.beschrijving}</p>
                                            <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                <span><i class="fas fa-calendar mr-1"></i>${melding.vervaldatum}</span>
                                                <span><i class="fas fa-clock mr-1"></i>Vervalt ${this.getTimeUntil(melding.vervaldatum)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="text-green-600 hover:text-green-800 melding-voltooid" data-id="${melding.id}">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="text-blue-600 hover:text-blue-800 melding-uitstel" data-id="${melding.id}">
                                            <i class="fas fa-clock"></i>
                                        </button>
                                        <button class="text-red-600 hover:text-red-800 melding-verwijder" data-id="${melding.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Alle meldingen -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-lg font-medium text-gray-900">Alle meldingen</h2>
                    </div>
                    <div class="divide-y divide-gray-200" id="meldingenLijst">
                        ${meldingen.map(melding => `
                            <div class="p-6 hover:bg-gray-50 melding-item" data-type="${melding.type}" data-prioriteit="${melding.prioriteit}" data-status="${melding.status}">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-start space-x-4">
                                        <div class="flex-shrink-0">
                                            <div class="w-10 h-10 rounded-full flex items-center justify-center ${
                                                melding.prioriteit === 'hoog' ? 'bg-red-100' :
                                                melding.prioriteit === 'normaal' ? 'bg-yellow-100' :
                                                'bg-green-100'
                                            }">
                                                <i class="fas ${this.getMeldingIcon(melding.type)} ${
                                                    melding.prioriteit === 'hoog' ? 'text-red-600' :
                                                    melding.prioriteit === 'normaal' ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }"></i>
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-2">
                                                <h4 class="text-sm font-medium text-gray-900">${melding.titel}</h4>
                                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    melding.prioriteit === 'hoog' ? 'bg-red-100 text-red-800' :
                                                    melding.prioriteit === 'normaal' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }">
                                                    ${melding.prioriteit}
                                                </span>
                                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    melding.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                                    melding.status === 'voltooid' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }">
                                                    ${melding.status}
                                                </span>
                                            </div>
                                            <p class="mt-1 text-sm text-gray-600">${melding.beschrijving}</p>
                                            <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                <span><i class="fas fa-calendar mr-1"></i>${melding.vervaldatum}</span>
                                                <span><i class="fas fa-user mr-1"></i>${melding.toegewezen_aan || 'Niemand'}</span>
                                                ${melding.gerelateerd_item ? `<span><i class="fas fa-link mr-1"></i>${melding.gerelateerd_item}</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="text-primary hover:text-blue-700 melding-bewerk" data-id="${melding.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="text-green-600 hover:text-green-800 melding-voltooid" data-id="${melding.id}">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="text-red-600 hover:text-red-800 melding-verwijder" data-id="${melding.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Herinnering formulier modal -->
            <div id="herinneringModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Nieuwe herinnering</h3>
                            <button id="closeHerinneringModal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form id="herinneringForm" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                                    <input type="text" name="titel" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                                    <textarea name="beschrijving" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"></textarea>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                        <option value="">Selecteer type</option>
                                        <option value="keuring">Keuring</option>
                                        <option value="documenten">Documenten</option>
                                        <option value="betaling">Betalingen</option>
                                        <option value="onderhoud">Onderhoud</option>
                                        <option value="verlof">Verlof</option>
                                        <option value="algemeen">Algemeen</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
                                    <select name="prioriteit" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                        <option value="laag">Laag</option>
                                        <option value="normaal" selected>Normaal</option>
                                        <option value="hoog">Hoog</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Vervaldatum</label>
                                    <input type="date" name="vervaldatum" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Toegewezen aan</label>
                                    <input type="text" name="toegewezen_aan" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Gerelateerd item (optioneel)</label>
                                    <input type="text" name="gerelateerd_item" placeholder="Bijv. BMW 320d, Factuur #123, etc." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" id="cancelHerinneringForm" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Annuleren
                                </button>
                                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-blue-700">
                                    Opslaan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async getZoekenContent() {
        return `
            <div class="space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Zoeken & Filteren</h1>
                    <div class="mt-4 lg:mt-0">
                        <button id="geavanceerdZoekenBtn" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-sliders-h mr-2"></i>
                            Geavanceerd zoeken
                        </button>
                    </div>
                </div>

                <!-- Snelzoeken -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Snelzoeken</h2>
                    <div class="relative">
                        <input type="text" id="globalSearch" placeholder="Zoek op chassisnummer, nummerplaat, klant, stocknummer, medewerker..."
                               class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-lg">
                        <i class="fas fa-search absolute left-4 top-4 text-gray-400"></i>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 search-suggestion" data-query="keuring rood">
                            Keuringen vereist
                        </button>
                        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 search-suggestion" data-query="oldtimer">
                            Oldtimers
                        </button>
                        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 search-suggestion" data-query="documenten ontbreken">
                            Documenten ontbreken
                        </button>
                        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 search-suggestion" data-query="openstaande betalingen">
                            Openstaande betalingen
                        </button>
                    </div>
                </div>

                <!-- Zoekresultaten -->
                <div id="zoekresultaten" class="space-y-6 hidden">
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-lg font-medium text-gray-900 mb-4">Zoekresultaten</h2>
                        <div id="resultatenContainer">
                            <!-- Results will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Geavanceerde filters -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-lg font-medium text-gray-900">Filters</h2>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <!-- Wagen filters -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-medium text-gray-900">Wagens</h3>
                                <div class="space-y-2">
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="stockwagens">
                                        <span class="ml-2 text-sm text-gray-700">Stockwagens</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="consignatie">
                                        <span class="ml-2 text-sm text-gray-700">Consignatie</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="oldtimer">
                                        <span class="ml-2 text-sm text-gray-700">Oldtimers</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="lichte_vracht">
                                        <span class="ml-2 text-sm text-gray-700">Lichte vracht</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Status filters -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-medium text-gray-900">Status</h3>
                                <div class="space-y-2">
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="keuring_rood">
                                        <span class="ml-2 text-sm text-gray-700">Keuring vereist (rood)</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="keuring_oranje">
                                        <span class="ml-2 text-sm text-gray-700">Herkeuring (oranje)</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="documenten_ontbreken">
                                        <span class="ml-2 text-sm text-gray-700">Documenten ontbreken</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="aankoop_incompleet">
                                        <span class="ml-2 text-sm text-gray-700">Aankoop incompleet</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Personeel filters -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-medium text-gray-900">Personeel</h3>
                                <div class="space-y-2">
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="verlof_gepland">
                                        <span class="ml-2 text-sm text-gray-700">Verlof gepland</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="documenten_personeel_ontbreken">
                                        <span class="ml-2 text-sm text-gray-700">Documenten ontbreken</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Financieel filters -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-medium text-gray-900">Financieel</h3>
                                <div class="space-y-2">
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="openstaande_betalingen">
                                        <span class="ml-2 text-sm text-gray-700">Openstaande betalingen</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="hoge_winst">
                                        <span class="ml-2 text-sm text-gray-700">Hoge winst (>€5000)</span>
                                    </label>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary filter-checkbox" data-filter="lage_marge">
                                        <span class="ml-2 text-sm text-gray-700">Lage marge (<10%)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-6 flex space-x-3">
                            <button id="applyFiltersBtn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-filter mr-2"></i>
                                Filters toepassen
                            </button>
                            <button id="clearFiltersBtn" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                                <i class="fas fa-times mr-2"></i>
                                Filters wissen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async getMeldingen() {
        const meldingen = await this.kvGet('meldingen') || [];
        return meldingen.length > 0 ? meldingen : [
            {
                id: 1,
                titel: 'Keuring vervalt binnenkort - BMW 320d',
                beschrijving: 'De keuring van de BMW 320d (stocknummer BMW001) verloopt over 5 dagen.',
                type: 'keuring',
                prioriteit: 'hoog',
                status: 'open',
                vervaldatum: '2024-12-31',
                toegewezen_aan: 'Jan Janssen',
                gerelateerd_item: 'BMW 320d (BMW001)'
            },
            {
                id: 2,
                titel: 'Documenten ontbreken - Mercedes A180',
                beschrijving: 'Aankoopbordel en marge-attest nog niet ontvangen.',
                type: 'documenten',
                prioriteit: 'normaal',
                status: 'open',
                vervaldatum: '2025-01-05',
                toegewezen_aan: 'Marie Pieters',
                gerelateerd_item: 'Mercedes A180 (MER001)'
            },
            {
                id: 3,
                titel: 'Openstaande betaling Johnson B.V.',
                beschrijving: 'Factuur F-2024-0123 voor €8.500 is 25 dagen over tijd.',
                type: 'betaling',
                prioriteit: 'hoog',
                status: 'open',
                vervaldatum: '2024-12-01',
                toegewezen_aan: 'Administratie',
                gerelateerd_item: 'Factuur F-2024-0123'
            }
        ];
    }

    getMeldingIcon(type) {
        const icons = {
            keuring: 'fa-clipboard-check',
            documenten: 'fa-file-alt',
            betaling: 'fa-euro-sign',
            onderhoud: 'fa-wrench',
            verlof: 'fa-calendar-alt',
            algemeen: 'fa-bell'
        };
        return icons[type] || 'fa-bell';
    }

    getTimeUntil(dateString) {
        const targetDate = new Date(dateString);
        const now = new Date();
        const diffTime = targetDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return `${Math.abs(diffDays)} dagen geleden`;
        if (diffDays === 0) return 'vandaag';
        if (diffDays === 1) return 'morgen';
        return `over ${diffDays} dagen`;
    }
    
    initWagens() {
        // Event listeners for wagens module
        document.getElementById('nieuweWagenBtn').addEventListener('click', () => {
            this.showWagenForm();
        });

        document.getElementById('closeWagenModal').addEventListener('click', () => {
            this.hideWagenModal();
        });

        document.getElementById('cancelWagenForm').addEventListener('click', () => {
            this.hideWagenModal();
        });

        document.getElementById('wagenForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWagen();
        });

        // Auto-calculate profit
        const inkoopInput = document.querySelector('input[name="inkoopprijs"]');
        const verkoopInput = document.querySelector('input[name="verkoopprijs"]');
        const winstInput = document.querySelector('input[name="winst"]');
        
        [inkoopInput, verkoopInput].forEach(input => {
            input.addEventListener('input', () => {
                const inkoop = parseFloat(inkoopInput.value) || 0;
                const verkoop = parseFloat(verkoopInput.value) || 0;
                winstInput.value = (verkoop - inkoop).toFixed(2);
            });
        });

        // Edit and delete buttons
        document.querySelectorAll('.edit-wagen').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                this.editWagen(id);
            });
        });

        document.querySelectorAll('.delete-wagen').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                this.deleteWagen(id);
            });
        });

        // Wagen card click for details
        document.querySelectorAll('.wagen-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const id = card.dataset.id;
                    this.showWagenDetails(id);
                }
            });
        });

        // Filters
        ['statusFilter', 'keuringFilter', 'typeFilter', 'searchWagen'].forEach(filterId => {
            document.getElementById(filterId).addEventListener('change', () => {
                this.filterWagens();
            });
        });

        document.getElementById('searchWagen').addEventListener('input', () => {
            this.filterWagens();
        });
    }
    initPersoneel() {
        // Event listeners for personeel module
        document.getElementById('nieuwPersoneelBtn').addEventListener('click', () => {
            this.showPersoneelForm();
        });

        document.getElementById('closePersoneelModal').addEventListener('click', () => {
            this.hidePersoneelModal();
        });

        document.getElementById('cancelPersoneelForm').addEventListener('click', () => {
            this.hidePersoneelModal();
        });

        document.getElementById('personeelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMedewerker();
        });

        // Edit and delete buttons
        document.querySelectorAll('.edit-medewerker').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editMedewerker(id);
            });
        });

        document.querySelectorAll('.delete-medewerker').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteMedewerker(id);
            });
        });
    }
    initDocumenten() {
        // Event listeners for documenten module
        document.getElementById('uploadDocumentBtn').addEventListener('click', () => {
            this.showUploadModal();
        });

        document.getElementById('closeUploadModal').addEventListener('click', () => {
            this.hideUploadModal();
        });

        document.getElementById('cancelUpload').addEventListener('click', () => {
            this.hideUploadModal();
        });

        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDocument();
        });

        // File input handling
        const fileInput = document.getElementById('fileInput');
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        
        document.querySelector('.border-dashed').addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;
                filePreview.classList.remove('hidden');
            }
        });

        document.getElementById('removeFile').addEventListener('click', () => {
            fileInput.value = '';
            filePreview.classList.add('hidden');
        });

        // Document action buttons
        document.querySelectorAll('.view-document').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.viewDocument(id);
            });
        });

        document.querySelectorAll('.download-document').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.downloadDocument(id);
            });
        });

        document.querySelectorAll('.edit-document').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editDocument(id);
            });
        });

        document.querySelectorAll('.delete-document').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteDocument(id);
            });
        });

        // Filters
        ['documentCategorieFilter', 'documentStatusFilter', 'documentTypeFilter', 'documentSearch'].forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.filterDocumenten();
                });
            }
        });

        document.getElementById('documentSearch').addEventListener('input', () => {
            this.filterDocumenten();
        });
    }

    showUploadModal() {
        document.getElementById('uploadModal').classList.remove('hidden');
        document.getElementById('uploadForm').reset();
        document.getElementById('filePreview').classList.add('hidden');
    }

    hideUploadModal() {
        document.getElementById('uploadModal').classList.add('hidden');
    }

    async saveDocument() {
        const formData = new FormData(document.getElementById('uploadForm'));
        const fileInput = document.getElementById('fileInput');
        
        if (!fileInput.files[0]) {
            this.showToast('Selecteer een bestand om te uploaden', 'error');
            return;
        }

        const documentData = {
            id: Date.now(),
            naam: formData.get('naam'),
            type: formData.get('type'),
            categorie: formData.get('categorie'),
            gerelateerd_aan: formData.get('gerelateerd_aan'),
            vervaldatum: formData.get('vervaldatum') || null,
            upload_datum: new Date().toISOString().split('T')[0],
            status: 'compleet',
            ocr_verwerkt: formData.get('ocr_verwerken') === 'on',
            bestandsnaam: fileInput.files[0].name,
            bestandsgrootte: (fileInput.files[0].size / (1024 * 1024)).toFixed(1) + ' MB',
            bestandstype: fileInput.files[0].type,
            geupload_door: this.currentUser.username
        };

        const documenten = await this.kvGet('documenten') || [];
        documenten.push(documentData);
        await this.kvSet('documenten', documenten);

        this.showToast('Document succesvol geüpload', 'success');
        this.hideUploadModal();
        this.showPage('documenten'); // Refresh the page
    }

    viewDocument(id) {
        this.showToast('Document weergave (placeholder)', 'info');
    }

    downloadDocument(id) {
        this.showToast('Document gedownload', 'success');
    }

    editDocument(id) {
        this.showToast('Document bewerken (placeholder)', 'info');
    }

    async deleteDocument(id) {
        if (confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
            const documenten = await this.kvGet('documenten') || [];
            const filteredDocumenten = documenten.filter(d => d.id != id);
            await this.kvSet('documenten', filteredDocumenten);
            
            this.showToast('Document verwijderd', 'success');
            this.showPage('documenten'); // Refresh the page
        }
    }

    filterDocumenten() {
        const categorieFilter = document.getElementById('documentCategorieFilter').value;
        const statusFilter = document.getElementById('documentStatusFilter').value;
        const typeFilter = document.getElementById('documentTypeFilter').value;
        const searchFilter = document.getElementById('documentSearch').value.toLowerCase();

        const documentRows = document.querySelectorAll('.document-row');
        
        documentRows.forEach(row => {
            let show = true;
            
            if (categorieFilter && row.dataset.categorie !== categorieFilter) show = false;
            if (statusFilter && row.dataset.status !== statusFilter) show = false;
            if (typeFilter && row.dataset.type !== typeFilter) show = false;
            if (searchFilter && !row.textContent.toLowerCase().includes(searchFilter)) show = false;
            
            row.style.display = show ? 'table-row' : 'none';
        });
    }
    initFinancien() {
        // Initialize financial module
        this.initFinancieeTabs();
        this.initWinstChart();
        
        // Event listeners
        document.getElementById('exportFinancienBtn').addEventListener('click', () => {
            this.exportFinancieData();
        });

        document.getElementById('nieuweTransactieBtn').addEventListener('click', () => {
            this.showTransactieForm();
        });

        document.getElementById('periodeFilter').addEventListener('change', () => {
            this.updateWinstChart();
        });
    }

    initFinancieeTabs() {
        document.querySelectorAll('.financie-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                document.querySelectorAll('.financie-tab').forEach(t => {
                    t.classList.remove('border-primary', 'text-primary');
                    t.classList.add('border-transparent', 'text-gray-500');
                });
                
                // Add active class to clicked tab
                tab.classList.remove('border-transparent', 'text-gray-500');
                tab.classList.add('border-primary', 'text-primary');
                
                // Hide all content
                document.querySelectorAll('.financie-content').forEach(content => {
                    content.classList.add('hidden');
                });
                
                // Show selected content
                const tabName = tab.dataset.tab;
                document.getElementById(`${tabName}-content`).classList.remove('hidden');
            });
        });
    }

    async initWinstChart() {
        const ctx = document.getElementById('winstChart');
        if (ctx) {
            const wagens = await this.kvGet('wagens') || [];
            const verkochteWagens = wagens.filter(w => w.status === 'verkocht');
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: verkochteWagens.map(w => `${w.merk} ${w.model}`),
                    datasets: [{
                        label: 'Winst (€)',
                        data: verkochteWagens.map(w => (w.verkoopprijs || 0) - (w.inkoopprijs || 0)),
                        backgroundColor: '#3b82f6',
                        borderColor: '#1e40af',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '€' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
        }
    }

    async updateWinstChart() {
        // Placeholder for chart update based on period filter
        this.showToast('Chart bijgewerkt', 'info');
    }

    exportFinancieData() {
        // Placeholder for export functionality
        this.showToast('Financiële data geëxporteerd', 'success');
    }

    showTransactieForm() {
        // Placeholder for transaction form
        this.showToast('Transactie formulier', 'info');
    }
    initMeldingen() {
        // Event listeners for meldingen module
        document.getElementById('nieuweHerinneringBtn').addEventListener('click', () => {
            this.showHerinneringForm();
        });

        document.getElementById('closeHerinneringModal').addEventListener('click', () => {
            this.hideHerinneringModal();
        });

        document.getElementById('cancelHerinneringForm').addEventListener('click', () => {
            this.hideHerinneringModal();
        });

        document.getElementById('herinneringForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveHerinnering();
        });

        document.getElementById('markeerAlleGelezenBtn').addEventListener('click', () => {
            this.markeerAlleMeldingenGelezen();
        });

        // Melding action buttons
        document.querySelectorAll('.melding-voltooid').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.markeerMeldingVoltooid(id);
            });
        });

        document.querySelectorAll('.melding-verwijder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.verwijderMelding(id);
            });
        });

        // Filters
        ['meldingTypeFilter', 'prioriteitFilter', 'statusMeldingFilter'].forEach(filterId => {
            document.getElementById(filterId).addEventListener('change', () => {
                this.filterMeldingen();
            });
        });
    }

    initZoeken() {
        // Event listeners for search module
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            this.performGlobalSearch(e.target.value);
        });

        document.querySelectorAll('.search-suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                document.getElementById('globalSearch').value = query;
                this.performGlobalSearch(query);
            });
        });

        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('geavanceerdZoekenBtn').addEventListener('click', () => {
            this.showGeavanceerdZoeken();
        });
    }

    showHerinneringForm() {
        document.getElementById('herinneringModal').classList.remove('hidden');
        document.getElementById('herinneringForm').reset();
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.querySelector('input[name="vervaldatum"]').value = tomorrow.toISOString().split('T')[0];
    }

    hideHerinneringModal() {
        document.getElementById('herinneringModal').classList.add('hidden');
    }

    async saveHerinnering() {
        const formData = new FormData(document.getElementById('herinneringForm'));
        const herinneringData = {
            id: Date.now(),
            titel: formData.get('titel'),
            beschrijving: formData.get('beschrijving'),
            type: formData.get('type'),
            prioriteit: formData.get('prioriteit'),
            status: 'open',
            vervaldatum: formData.get('vervaldatum'),
            toegewezen_aan: formData.get('toegewezen_aan'),
            gerelateerd_item: formData.get('gerelateerd_item'),
            aangemaakt_door: this.currentUser.username,
            aangemaakt_op: new Date().toISOString()
        };

        const meldingen = await this.kvGet('meldingen') || [];
        meldingen.push(herinneringData);
        await this.kvSet('meldingen', meldingen);

        this.showToast('Herinnering succesvol aangemaakt', 'success');
        this.hideHerinneringModal();
        this.showPage('meldingen'); // Refresh the page
    }

    async markeerMeldingVoltooid(id) {
        const meldingen = await this.kvGet('meldingen') || [];
        const melding = meldingen.find(m => m.id == id);
        if (melding) {
            melding.status = 'voltooid';
            melding.voltooid_op = new Date().toISOString();
            melding.voltooid_door = this.currentUser.username;
            await this.kvSet('meldingen', meldingen);
            this.showToast('Melding gemarkeerd als voltooid', 'success');
            this.showPage('meldingen');
        }
    }

    async verwijderMelding(id) {
        if (confirm('Weet je zeker dat je deze melding wilt verwijderen?')) {
            const meldingen = await this.kvGet('meldingen') || [];
            const filteredMeldingen = meldingen.filter(m => m.id != id);
            await this.kvSet('meldingen', filteredMeldingen);
            this.showToast('Melding verwijderd', 'success');
            this.showPage('meldingen');
        }
    }

    async markeerAlleMeldingenGelezen() {
        const meldingen = await this.kvGet('meldingen') || [];
        meldingen.forEach(melding => {
            if (melding.status === 'open') {
                melding.gelezen = true;
                melding.gelezen_door = this.currentUser.username;
                melding.gelezen_op = new Date().toISOString();
            }
        });
        await this.kvSet('meldingen', meldingen);
        this.showToast('Alle meldingen gemarkeerd als gelezen', 'success');
    }

    filterMeldingen() {
        const typeFilter = document.getElementById('meldingTypeFilter').value;
        const prioriteitFilter = document.getElementById('prioriteitFilter').value;
        const statusFilter = document.getElementById('statusMeldingFilter').value;

        const meldingenItems = document.querySelectorAll('.melding-item');
        
        meldingenItems.forEach(item => {
            let show = true;
            
            if (typeFilter && item.dataset.type !== typeFilter) show = false;
            if (prioriteitFilter && item.dataset.prioriteit !== prioriteitFilter) show = false;
            if (statusFilter && item.dataset.status !== statusFilter) show = false;
            
            item.style.display = show ? 'block' : 'none';
        });
    }

    async performGlobalSearch(query) {
        if (query.length < 3) {
            document.getElementById('zoekresultaten').classList.add('hidden');
            return;
        }

        // Search across all data
        const [wagens, medewerkers, meldingen] = await Promise.all([
            this.kvGet('wagens'),
            this.kvGet('medewerkers'),
            this.kvGet('meldingen')
        ]);

        const results = [];
        const searchLower = query.toLowerCase();

        // Search wagens
        wagens.forEach(wagen => {
            if (
                wagen.merk?.toLowerCase().includes(searchLower) ||
                wagen.model?.toLowerCase().includes(searchLower) ||
                wagen.chassisnummer?.toLowerCase().includes(searchLower) ||
                wagen.nummerplaat?.toLowerCase().includes(searchLower) ||
                wagen.stocknummer?.toLowerCase().includes(searchLower) ||
                (query.includes('keuring') && wagen.keuringsstatus === 'rood') ||
                (query.includes('oldtimer') && wagen.oldtimer) ||
                (query.includes('documenten') && (!wagen.documenten?.aankoop?.compleet || !wagen.documenten?.verkoop?.compleet))
            ) {
                results.push({
                    type: 'wagen',
                    title: `${wagen.merk} ${wagen.model}`,
                    subtitle: `Stocknummer: ${wagen.stocknummer}`,
                    details: `Keuringsstatus: ${wagen.keuringsstatus}, Status: ${wagen.status}`,
                    id: wagen.id
                });
            }
        });

        // Search medewerkers
        medewerkers.forEach(medewerker => {
            if (
                medewerker.naam?.toLowerCase().includes(searchLower) ||
                medewerker.email?.toLowerCase().includes(searchLower) ||
                medewerker.functie?.toLowerCase().includes(searchLower)
            ) {
                results.push({
                    type: 'medewerker',
                    title: medewerker.naam,
                    subtitle: medewerker.functie,
                    details: `Email: ${medewerker.email}, Status: ${medewerker.status}`,
                    id: medewerker.id
                });
            }
        });

        // Search meldingen
        meldingen.forEach(melding => {
            if (
                melding.titel?.toLowerCase().includes(searchLower) ||
                melding.beschrijving?.toLowerCase().includes(searchLower) ||
                melding.gerelateerd_item?.toLowerCase().includes(searchLower) ||
                (query.includes('openstaande') && melding.type === 'betaling')
            ) {
                results.push({
                    type: 'melding',
                    title: melding.titel,
                    subtitle: `Type: ${melding.type}, Prioriteit: ${melding.prioriteit}`,
                    details: melding.beschrijving,
                    id: melding.id
                });
            }
        });

        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        const container = document.getElementById('resultatenContainer');
        const zoekresultaten = document.getElementById('zoekresultaten');

        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-search text-gray-400 text-3xl mb-4"></i>
                    <p class="text-gray-500">Geen resultaten gevonden voor "${query}"</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="mb-4">
                    <p class="text-sm text-gray-600">${results.length} resultaten gevonden voor "${query}"</p>
                </div>
                <div class="space-y-4">
                    ${results.map(result => `
                        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer search-result" data-type="${result.type}" data-id="${result.id}">
                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${
                                        result.type === 'wagen' ? 'bg-blue-100' :
                                        result.type === 'medewerker' ? 'bg-green-100' :
                                        'bg-yellow-100'
                                    }">
                                        <i class="fas ${
                                            result.type === 'wagen' ? 'fa-car' :
                                            result.type === 'medewerker' ? 'fa-user' :
                                            'fa-bell'
                                        } ${
                                            result.type === 'wagen' ? 'text-blue-600' :
                                            result.type === 'medewerker' ? 'text-green-600' :
                                            'text-yellow-600'
                                        }"></i>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <h4 class="text-sm font-medium text-gray-900">${result.title}</h4>
                                    <p class="text-sm text-gray-600">${result.subtitle}</p>
                                    <p class="text-xs text-gray-500 mt-1">${result.details}</p>
                                </div>
                                <div class="flex-shrink-0">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        result.type === 'wagen' ? 'bg-blue-100 text-blue-800' :
                                        result.type === 'medewerker' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }">
                                        ${result.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add click handlers for search results
            document.querySelectorAll('.search-result').forEach(result => {
                result.addEventListener('click', () => {
                    const type = result.dataset.type;
                    const id = result.dataset.id;
                    this.navigateToSearchResult(type, id);
                });
            });
        }

        zoekresultaten.classList.remove('hidden');
    }

    navigateToSearchResult(type, id) {
        switch (type) {
            case 'wagen':
                this.showPage('wagens');
                setTimeout(() => this.showWagenDetails(id), 100);
                break;
            case 'medewerker':
                this.showPage('personeel');
                setTimeout(() => this.editMedewerker(id), 100);
                break;
            case 'melding':
                this.showPage('meldingen');
                break;
        }
    }

    applyFilters() {
        const checkedFilters = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map(cb => cb.dataset.filter);
        this.showToast(`${checkedFilters.length} filters toegepast`, 'info');
        // Apply actual filtering logic here
    }

    clearFilters() {
        document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('zoekresultaten').classList.add('hidden');
        this.showToast('Filters gewist', 'info');
    }

    showGeavanceerdZoeken() {
        this.showToast('Geavanceerd zoeken (placeholder)', 'info');
    }
    showWagenForm() {
        document.getElementById('wagenModal').classList.remove('hidden');
        document.getElementById('wagenModalTitle').textContent = 'Nieuwe wagen';
        document.getElementById('wagenForm').reset();
    }

    hideWagenModal() {
        document.getElementById('wagenModal').classList.add('hidden');
    }

    async saveWagen() {
        const formData = new FormData(document.getElementById('wagenForm'));
        const wagenData = {
            id: Date.now(), // Simple ID generation
            merk: formData.get('merk'),
            model: formData.get('model'),
            stocknummer: formData.get('stocknummer'),
            chassisnummer: formData.get('chassisnummer'),
            nummerplaat: formData.get('nummerplaat'),
            eerste_inschrijving: formData.get('eerste_inschrijving'),
            bouwjaar: parseInt(formData.get('bouwjaar')) || null,
            kleur: formData.get('kleur'),
            kmstand: parseInt(formData.get('kmstand')) || null,
            brandstof: formData.get('brandstof'),
            transmissie: formData.get('transmissie'),
            vermogen: parseInt(formData.get('vermogen')) || null,
            status: formData.get('status') || 'stock',
            keuringsstatus: formData.get('keuringsstatus') || 'rood',
            werkzaamheden: formData.get('werkzaamheden'),
            inkoopprijs: parseFloat(formData.get('inkoopprijs')) || null,
            verkoopprijs: parseFloat(formData.get('verkoopprijs')) || null,
            oldtimer: formData.get('oldtimer') === 'on',
            lichte_vracht: formData.get('lichte_vracht') === 'on',
            documenten: {
                aankoop: {
                    compleet: ['doc_aankoopbordel', 'doc_marge_attest', 'doc_factuur', 'doc_inschrijving_1', 'doc_inschrijving_2', 'doc_coc']
                        .every(doc => formData.get(doc) === 'on')
                },
                verkoop: {
                    compleet: ['doc_verkoopcontract', 'doc_overdracht', 'doc_betaling']
                        .every(doc => formData.get(doc) === 'on')
                },
                garantie: {
                    compleet: ['doc_garantie_contract', 'doc_garantie_voorwaarden', 'doc_onderhoudsboek']
                        .every(doc => formData.get(doc) === 'on')
                }
            }
        };

        // Save to storage
        const wagens = await this.kvGet('wagens') || [];
        wagens.push(wagenData);
        await this.kvSet('wagens', wagens);

        this.showToast('Wagen succesvol toegevoegd', 'success');
        this.hideWagenModal();
        this.showPage('wagens'); // Refresh the page
    }

    async editWagen(id) {
        const wagens = await this.kvGet('wagens') || [];
        const wagen = wagens.find(w => w.id == id);
        if (wagen) {
            // Populate form with existing data
            const form = document.getElementById('wagenForm');
            Object.keys(wagen).forEach(key => {
                const field = form.elements[key];
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = wagen[key];
                    } else {
                        field.value = wagen[key] || '';
                    }
                }
            });

            // Set document checkboxes
            if (wagen.documenten) {
                ['doc_aankoopbordel', 'doc_marge_attest', 'doc_factuur', 'doc_inschrijving_1', 'doc_inschrijving_2', 'doc_coc'].forEach(doc => {
                    const field = form.elements[doc];
                    if (field) field.checked = wagen.documenten.aankoop?.compleet || false;
                });
                
                ['doc_verkoopcontract', 'doc_overdracht', 'doc_betaling'].forEach(doc => {
                    const field = form.elements[doc];
                    if (field) field.checked = wagen.documenten.verkoop?.compleet || false;
                });
                
                ['doc_garantie_contract', 'doc_garantie_voorwaarden', 'doc_onderhoudsboek'].forEach(doc => {
                    const field = form.elements[doc];
                    if (field) field.checked = wagen.documenten.garantie?.compleet || false;
                });
            }

            document.getElementById('wagenModalTitle').textContent = 'Bewerk wagen';
            document.getElementById('wagenModal').classList.remove('hidden');

            // Store ID for update
            form.dataset.editId = id;
        }
    }

    async deleteWagen(id) {
        if (confirm('Weet je zeker dat je deze wagen wilt verwijderen?')) {
            const wagens = await this.kvGet('wagens') || [];
            const filteredWagens = wagens.filter(w => w.id != id);
            await this.kvSet('wagens', filteredWagens);
            
            this.showToast('Wagen verwijderd', 'success');
            this.showPage('wagens'); // Refresh the page
        }
    }

    async showWagenDetails(id) {
        const wagens = await this.kvGet('wagens') || [];
        const wagen = wagens.find(w => w.id == id);
        if (wagen) {
            // Show detailed view (placeholder)
            this.showToast(`Details voor ${wagen.merk} ${wagen.model}`, 'info');
        }
    }

    filterWagens() {
        const statusFilter = document.getElementById('statusFilter').value;
        const keuringFilter = document.getElementById('keuringFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const searchFilter = document.getElementById('searchWagen').value.toLowerCase();

        const wagenCards = document.querySelectorAll('.wagen-card');
        
        wagenCards.forEach(card => {
            let show = true;
            
            // Status filter
            if (statusFilter) {
                const cardStatus = card.querySelector('.bg-green-100, .bg-blue-100, .bg-gray-100, .bg-yellow-100')?.textContent?.trim();
                if (cardStatus && !cardStatus.toLowerCase().includes(statusFilter)) {
                    show = false;
                }
            }
            
            // Search filter
            if (searchFilter) {
                const cardText = card.textContent.toLowerCase();
                if (!cardText.includes(searchFilter)) {
                    show = false;
                }
            }
            
            card.style.display = show ? 'block' : 'none';
        });
    }
    
    showPersoneelForm() {
        document.getElementById('personeelModal').classList.remove('hidden');
        document.getElementById('personeelModalTitle').textContent = 'Nieuw personeelslid';
        document.getElementById('personeelForm').reset();
    }

    hidePersoneelModal() {
        document.getElementById('personeelModal').classList.add('hidden');
    }

    async saveMedewerker() {
        const formData = new FormData(document.getElementById('personeelForm'));
        const medewerkerData = {
            id: Date.now(), // Simple ID generation
            naam: `${formData.get('voornaam')} ${formData.get('achternaam')}`,
            email: formData.get('email'),
            telefoon: formData.get('telefoon'),
            functie: formData.get('functie'),
            startdatum: formData.get('startdatum'),
            adres: formData.get('adres'),
            status: 'actief',
            documenten: [
                { type: 'Contract', status: formData.get('doc_contract') ? 'compleet' : 'ontbreekt' },
                { type: 'CV', status: formData.get('doc_cv') ? 'compleet' : 'ontbreekt' },
                { type: 'ID', status: formData.get('doc_identiteit') ? 'compleet' : 'ontbreekt' },
                { type: 'Diploma', status: formData.get('doc_diploma') ? 'compleet' : 'ontbreeks' }
            ]
        };

        // Save to storage
        const medewerkers = await this.kvGet('medewerkers') || [];
        medewerkers.push(medewerkerData);
        await this.kvSet('medewerkers', medewerkers);

        this.showToast('Personeelslid succesvol toegevoegd', 'success');
        this.hidePersoneelModal();
        this.showPage('personeel'); // Refresh the page
    }

    async editMedewerker(id) {
        const medewerkers = await this.kvGet('medewerkers') || [];
        const medewerker = medewerkers.find(m => m.id == id);
        if (medewerker) {
            // Populate form with existing data
            const form = document.getElementById('personeelForm');
            const nameParts = medewerker.naam.split(' ');
            form.voornaam.value = nameParts[0] || '';
            form.achternaam.value = nameParts.slice(1).join(' ') || '';
            form.email.value = medewerker.email || '';
            form.telefoon.value = medewerker.telefoon || '';
            form.functie.value = medewerker.functie || '';
            form.startdatum.value = medewerker.startdatum || '';
            form.adres.value = medewerker.adres || '';

            // Set document checkboxes
            form.doc_contract.checked = medewerker.documenten.find(d => d.type === 'Contract')?.status === 'compleet';
            form.doc_cv.checked = medewerker.documenten.find(d => d.type === 'CV')?.status === 'compleet';
            form.doc_identiteit.checked = medewerker.documenten.find(d => d.type === 'ID')?.status === 'compleet';
            form.doc_diploma.checked = medewerker.documenten.find(d => d.type === 'Diploma')?.status === 'compleet';

            document.getElementById('personeelModalTitle').textContent = 'Bewerk personeelslid';
            document.getElementById('personeelModal').classList.remove('hidden');

            // Store ID for update
            form.dataset.editId = id;
        }
    }

    async deleteMedewerker(id) {
        if (confirm('Weet je zeker dat je dit personeelslid wilt verwijderen?')) {
            const medewerkers = await this.kvGet('medewerkers') || [];
            const filteredMedewerkers = medewerkers.filter(m => m.id != id);
            await this.kvSet('medewerkers', filteredMedewerkers);
            
            this.showToast('Personeelslid verwijderd', 'success');
            this.showPage('personeel'); // Refresh the page
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AutoHandelApp();
});