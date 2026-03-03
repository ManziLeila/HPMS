import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    EN: {
        // ==================== LANDING PAGE ====================
        // Navigation
        signIn: 'Sign In',

        // Hero Section
        heroTitle: 'Streamlined Payroll',
        heroHighlight1: 'Anytime,',
        heroHighlight2: 'Anywhere',
        heroSubtitle: 'Manage employee compensation with precision. Automated calculations, RSSB compliance, and instant payslip generation—all from your dashboard.',
        getStartedFree: 'Get Started Free',
        contactSales: 'Contact Sales',
        bookADemo: 'Book a Demo',

        // Hero trust chips
        trustBankSecurity: 'Bank-grade security',
        trustRssbCompliant: 'RSSB compliant',
        trustPayslipsSeconds: 'Payslips in seconds',
        trustHrMdApprovals: 'HR & MD approvals',

        // Benefits
        benefit1: '500+ Companies Trust Us',
        benefit2: 'Secure & Private',
        benefit3: '10,000+ Payslips Generated',

        // Stats
        access: 'Access',
        accuracy: 'Accuracy',
        rssbCompliant: 'RSSB Compliant',

        // Features
        feature1Title: 'Employee Management',
        feature1Desc: 'Comprehensive employee data management and tracking',
        feature2Title: 'Automated Payroll',
        feature2Desc: 'Streamlined salary calculations with RSSB and tax compliance',
        feature3Title: 'Secure & Compliant',
        feature3Desc: 'Bank-grade security with full regulatory compliance',

        // ==================== LOGIN PAGE ====================
        payrollManagementSystem: 'Payroll Management System',
        secureLogin: 'Secure Login',
        mfaRequired: 'Multi-factor authentication is required for each payroll session.',
        email: 'Email',
        password: 'Password',
        mfaCode: 'MFA Code',
        sixDigitCode: '6-digit code',
        verifying: 'Verifying…',
        secureSignIn: 'Secure Sign In',

        // ==================== SIDEBAR ====================
        payrollManagement: 'Payroll Management',
        home: 'Home',
        dashboard: 'Dashboard',
        employees: 'Employees',
        employeeForm: 'Employee Form',
        bulkUpload: 'Bulk Upload',
        reports: 'Reports',
        role: 'Role',
        employee: 'Employee',

        // ==================== DASHBOARD PAGE ====================
        loadingDashboard: 'Loading dashboard...',
        totalEmployees: 'Total Employees',
        activeHeadcount: 'Active headcount',
        monthlyPayrollCost: 'Monthly Payroll Cost',
        allDeductionsApplied: 'All deductions applied',
        payrollRuns: 'Payroll Runs',
        securityPosture: 'Security Posture',
        cloudflareAes: 'Cloudflare + AES-256',
        securityDescription: 'Frontend traffic is enforced over SSL with Cloudflare shielding. Payroll data remains encrypted end-to-end before touching PostgreSQL storage.',
        monthlyGross: 'Monthly Gross',
        monthlyPaye: 'Monthly PAYE',

        // ==================== EMPLOYEES PAGE ====================
        employeeManagement: 'Employee Management',
        manageEmployeeInfo: 'Manage employee information and access',
        clientManagement: 'Client Management',
        manageClientsSubtext: 'Select a client to view and manage their employees.',
        noClientsFound: 'No clients found.',
        addClient: 'Add client',
        editClient: 'Edit client',
        clientName: 'Client name',
        clientNamePlaceholder: 'e.g. Acme Corp',
        clientNameRequired: 'Client name is required.',
        saving: 'Saving…',
        deleting: 'Deleting…',
        deleteClientConfirmation: 'Delete client',
        deleteClientWarning: 'Employees under this client will be unassigned (not deleted).',
        searchEmployees: 'Search employees...',
        addEmployee: 'Add Employee',
        id: 'ID',
        name: 'Name',
        fullName: 'Full Name',
        position: 'Position',
        department: 'Department',
        baseSalary: 'Base Salary',
        phone: 'Phone',
        bank: 'Bank',
        created: 'Created',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        noEmployeesFound: 'No employees found',
        numberOfEmployees: 'Number of employees',
        contractStart: 'Contract start',
        contractEnd: 'Contract end',
        clientContract: 'Client contract',
        noClientContract: 'No client contract',
        addClientContract: 'Add client contract',
        editClientContract: 'Edit client contract',
        clientContractStartRequired: 'Start date is required.',
        contractType: 'Contract type',
        notes: 'Notes',
        daysRemaining: 'Days remaining',
        expired: 'Expired',
        contractDatesHint: 'Contract start and end dates appear after contracts are added. Go to',
        toAddContracts: 'to add or manage contracts.',
        contracts: 'Contracts',
        loadingEmployees: 'Loading employees...',
        loading: 'Loading...',
        save: 'Save',
        saveChanges: 'Save Changes',
        cancel: 'Cancel',
        retry: 'Retry',
        editEmployee: 'Edit Employee',
        confirmDelete: 'Confirm Delete',
        deleteConfirmation: 'Are you sure you want to delete',
        deleteWarning: 'This action cannot be undone. All salary records for this employee will remain in the system.',
        deleteEmployeeButton: 'Delete Employee',
        accountHolderName: 'Account Holder Name',
        adminLegacy: 'Admin (Legacy)',
        hr: 'HR',
        financeOfficer: 'Finance Officer',

        // ==================== EMPLOYEE FORM PAGE ====================
        createNewEmployee: 'Create New Employee',
        editEmployeeDetails: 'Edit Employee Details',
        personalInformation: 'Personal Information',
        firstName: 'First Name',
        lastName: 'Last Name',
        dateOfBirth: 'Date of Birth',
        nationalId: 'National ID',
        contactInformation: 'Contact Information',
        phoneNumber: 'Phone Number',
        address: 'Address',
        employmentDetails: 'Employment Details',
        hireDate: 'Hire Date',
        bankingInformation: 'Banking Information',
        bankName: 'Bank Name',
        accountNumber: 'Account Number',
        salaryInformation: 'Salary Information',
        currency: 'Currency',
        submit: 'Submit',
        update: 'Update',
        creating: 'Creating...',
        updating: 'Updating...',

        // ==================== REPORTS PAGE ====================
        payrollReports: 'Payroll Reports',
        filterByPeriod: 'Filter by Period',
        selectPeriod: 'Select Period',
        generateReport: 'Generate Report',
        exportToPdf: 'Export to PDF',
        exportToExcel: 'Export to Excel',
        employeeName: 'Employee Name',
        grossSalary: 'Gross Salary',
        deductions: 'Deductions',
        netSalary: 'Net Salary',
        payslip: 'Payslip',
        download: 'Download',
        noReportsAvailable: 'No reports available for the selected period',

        // ==================== BULK UPLOAD PAGE ====================
        bulkEmployeeUpload: 'Bulk Employee Upload',
        uploadInstructions: 'Upload a CSV or Excel file containing employee data',
        downloadTemplate: 'Download Template',
        selectFile: 'Select File',
        uploadFile: 'Upload File',
        uploading: 'Uploading...',
        uploadSuccess: 'File uploaded successfully',
        uploadError: 'Error uploading file',
        processingRecords: 'Processing records...',

        // ==================== SHELL LAYOUT ====================
        logout: 'Logout',
        profile: 'Profile',
        settings: 'Settings',

        // ==================== COMMON MESSAGES ====================
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        refresh: 'Refresh',
        export: 'Export',
        import: 'Import',
        print: 'Print',

        // ==================== ERROR MESSAGES ====================
        requiredField: 'This field is required',
        invalidEmail: 'Invalid email address',
        invalidPhone: 'Invalid phone number',
        invalidDate: 'Invalid date',
        networkError: 'Network error. Please try again.',
        serverError: 'Server error. Please contact support.',
        unauthorized: 'Unauthorized access',
        notFound: 'Resource not found',

        // ==================== DATE/TIME ====================
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
    },
    FR: {
        // ==================== LANDING PAGE ====================
        // Navigation
        signIn: 'Se Connecter',

        // Hero Section
        heroTitle: 'Paie Simplifiée',
        heroHighlight1: 'À Tout Moment,',
        heroHighlight2: 'Partout',
        heroSubtitle: 'Gérez la rémunération des employés avec précision. Calculs automatisés, conformité RSSB et génération instantanée de bulletins de paie—le tout depuis votre tableau de bord.',
        getStartedFree: 'Commencer Gratuitement',
        contactSales: 'Contacter les Ventes',
        bookADemo: 'Réserver une Démo',

        // Hero trust chips
        trustBankSecurity: 'Sécurité bancaire',
        trustRssbCompliant: 'Conforme RSSB',
        trustPayslipsSeconds: 'Bulletins en secondes',
        trustHrMdApprovals: 'Validations HR et direction',

        // Benefits
        benefit1: '500+ Entreprises Nous Font Confiance',
        benefit2: 'Sécurisé et Privé',
        benefit3: '10 000+ Bulletins de Paie Générés',

        // Stats
        access: 'Accès',
        accuracy: 'Précision',
        rssbCompliant: 'Conforme RSSB',

        // Features
        feature1Title: 'Gestion des Employés',
        feature1Desc: 'Gestion et suivi complets des données des employés',
        feature2Title: 'Paie Automatisée',
        feature2Desc: 'Calculs de salaire simplifiés avec conformité RSSB et fiscale',
        feature3Title: 'Sécurisé et Conforme',
        feature3Desc: 'Sécurité bancaire avec conformité réglementaire complète',

        // ==================== LOGIN PAGE ====================
        payrollManagementSystem: 'Système de Gestion de la Paie',
        secureLogin: 'Connexion Sécurisée',
        mfaRequired: 'L\'authentification multifacteur est requise pour chaque session de paie.',
        email: 'Email',
        password: 'Mot de passe',
        mfaCode: 'Code MFA',
        sixDigitCode: 'Code à 6 chiffres',
        verifying: 'Vérification…',
        secureSignIn: 'Connexion Sécurisée',

        // ==================== SIDEBAR ====================
        payrollManagement: 'Gestion de la Paie',
        home: 'Accueil',
        dashboard: 'Tableau de Bord',
        employees: 'Employés',
        employeeForm: 'Formulaire Employé',
        bulkUpload: 'Téléchargement en Masse',
        reports: 'Rapports',
        role: 'Rôle',
        employee: 'Employé',

        // ==================== DASHBOARD PAGE ====================
        loadingDashboard: 'Chargement du tableau de bord...',
        totalEmployees: 'Total des Employés',
        activeHeadcount: 'Effectif actif',
        monthlyPayrollCost: 'Coût Mensuel de la Paie',
        allDeductionsApplied: 'Toutes les déductions appliquées',
        payrollRuns: 'Exécutions de Paie',
        securityPosture: 'Posture de Sécurité',
        cloudflareAes: 'Cloudflare + AES-256',
        securityDescription: 'Le trafic frontal est appliqué via SSL avec protection Cloudflare. Les données de paie restent cryptées de bout en bout avant d\'atteindre le stockage PostgreSQL.',
        monthlyGross: 'Brut Mensuel',
        monthlyPaye: 'PAYE Mensuel',

        // ==================== EMPLOYEES PAGE ====================
        employeeManagement: 'Gestion des Employés',
        manageEmployeeInfo: 'Gérer les informations et l\'accès des employés',
        clientManagement: 'Gestion des clients',
        manageClientsSubtext: 'Sélectionnez un client pour voir et gérer ses employés.',
        noClientsFound: 'Aucun client trouvé.',
        addClient: 'Ajouter un client',
        editClient: 'Modifier le client',
        clientName: 'Nom du client',
        clientNamePlaceholder: 'ex. Acme Corp',
        clientNameRequired: 'Le nom du client est requis.',
        saving: 'Enregistrement…',
        deleting: 'Suppression…',
        deleteClientConfirmation: 'Supprimer le client',
        deleteClientWarning: 'Les employés de ce client seront désassignés (non supprimés).',
        searchEmployees: 'Rechercher des employés...',
        addEmployee: 'Ajouter un Employé',
        id: 'ID',
        name: 'Nom',
        fullName: 'Nom Complet',
        position: 'Poste',
        department: 'Département',
        baseSalary: 'Salaire de Base',
        phone: 'Téléphone',
        bank: 'Banque',
        created: 'Créé',
        actions: 'Actions',
        edit: 'Modifier',
        delete: 'Supprimer',
        noEmployeesFound: 'Aucun employé trouvé',
        numberOfEmployees: 'Nombre d\'employés',
        contractStart: 'Début du contrat',
        contractEnd: 'Fin du contrat',
        clientContract: 'Contrat client',
        noClientContract: 'Aucun contrat client',
        addClientContract: 'Ajouter un contrat client',
        editClientContract: 'Modifier le contrat client',
        clientContractStartRequired: 'La date de début est requise.',
        contractType: 'Type de contrat',
        notes: 'Notes',
        daysRemaining: 'Jours restants',
        expired: 'Expiré',
        contractDatesHint: 'Les dates de début et fin de contrat s\'affichent après ajout des contrats. Allez à',
        toAddContracts: 'pour ajouter ou gérer les contrats.',
        contracts: 'Contrats',
        loadingEmployees: 'Chargement des employés...',
        loading: 'Chargement...',
        save: 'Enregistrer',
        saveChanges: 'Enregistrer les Modifications',
        cancel: 'Annuler',
        retry: 'Réessayer',
        editEmployee: 'Modifier l\'Employé',
        confirmDelete: 'Confirmer la Suppression',
        deleteConfirmation: 'Êtes-vous sûr de vouloir supprimer',
        deleteWarning: 'Cette action ne peut pas être annulée. Tous les enregistrements de salaire de cet employé resteront dans le système.',
        deleteEmployeeButton: 'Supprimer l\'Employé',
        accountHolderName: 'Nom du Titulaire du Compte',
        adminLegacy: 'Admin (Ancien)',
        hr: 'RH',
        financeOfficer: 'Agent Financier',

        // ==================== EMPLOYEE FORM PAGE ====================
        createNewEmployee: 'Créer un Nouvel Employé',
        editEmployeeDetails: 'Modifier les Détails de l\'Employé',
        personalInformation: 'Informations Personnelles',
        firstName: 'Prénom',
        lastName: 'Nom de Famille',
        dateOfBirth: 'Date de Naissance',
        nationalId: 'ID National',
        contactInformation: 'Informations de Contact',
        phoneNumber: 'Numéro de Téléphone',
        address: 'Adresse',
        employmentDetails: 'Détails de l\'Emploi',
        hireDate: 'Date d\'Embauche',
        bankingInformation: 'Informations Bancaires',
        bankName: 'Nom de la Banque',
        accountNumber: 'Numéro de Compte',
        salaryInformation: 'Informations Salariales',
        currency: 'Devise',
        submit: 'Soumettre',
        update: 'Mettre à Jour',
        creating: 'Création...',
        updating: 'Mise à jour...',

        // ==================== REPORTS PAGE ====================
        payrollReports: 'Rapports de Paie',
        filterByPeriod: 'Filtrer par Période',
        selectPeriod: 'Sélectionner une Période',
        generateReport: 'Générer un Rapport',
        exportToPdf: 'Exporter en PDF',
        exportToExcel: 'Exporter en Excel',
        employeeName: 'Nom de l\'Employé',
        grossSalary: 'Salaire Brut',
        deductions: 'Déductions',
        netSalary: 'Salaire Net',
        payslip: 'Bulletin de Paie',
        download: 'Télécharger',
        noReportsAvailable: 'Aucun rapport disponible pour la période sélectionnée',

        // ==================== BULK UPLOAD PAGE ====================
        bulkEmployeeUpload: 'Téléchargement en Masse d\'Employés',
        uploadInstructions: 'Téléchargez un fichier CSV ou Excel contenant les données des employés',
        downloadTemplate: 'Télécharger le Modèle',
        selectFile: 'Sélectionner un Fichier',
        uploadFile: 'Télécharger le Fichier',
        uploading: 'Téléchargement...',
        uploadSuccess: 'Fichier téléchargé avec succès',
        uploadError: 'Erreur lors du téléchargement du fichier',
        processingRecords: 'Traitement des enregistrements...',

        // ==================== SHELL LAYOUT ====================
        logout: 'Déconnexion',
        profile: 'Profil',
        settings: 'Paramètres',

        // ==================== COMMON MESSAGES ====================
        success: 'Succès',
        error: 'Erreur',
        warning: 'Avertissement',
        info: 'Info',
        confirm: 'Confirmer',
        yes: 'Oui',
        no: 'Non',
        close: 'Fermer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        refresh: 'Actualiser',
        export: 'Exporter',
        import: 'Importer',
        print: 'Imprimer',

        // ==================== ERROR MESSAGES ====================
        requiredField: 'Ce champ est obligatoire',
        invalidEmail: 'Adresse email invalide',
        invalidPhone: 'Numéro de téléphone invalide',
        invalidDate: 'Date invalide',
        networkError: 'Erreur réseau. Veuillez réessayer.',
        serverError: 'Erreur serveur. Veuillez contacter le support.',
        unauthorized: 'Accès non autorisé',
        notFound: 'Ressource non trouvée',

        // ==================== DATE/TIME ====================
        january: 'Janvier',
        february: 'Février',
        march: 'Mars',
        april: 'Avril',
        may: 'Mai',
        june: 'Juin',
        july: 'Juillet',
        august: 'Août',
        september: 'Septembre',
        october: 'Octobre',
        november: 'Novembre',
        december: 'Décembre',
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'EN';
    });

    useEffect(() => {
        localStorage.setItem('preferredLanguage', language);
    }, [language]);

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
