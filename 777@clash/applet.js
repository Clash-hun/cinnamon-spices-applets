const Applet = imports.ui.applet;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Util = imports.misc.util;
const Soup = imports.gi.Soup;
const PopupMenu = imports.ui.popupMenu;
const Settings = imports.ui.settings;

const API_KEY = '2c19353f1c22a445616a43b0bacbb218';

function MyApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        try {
            this.settings = new Settings.AppletSettings(this, "777@clash.org", instance_id);
            this.settings.bind("saved-bible-id", "savedBibleId", this.onBibleIdChanged);
            this.set_applet_icon_path(GLib.get_home_dir() + "/.local/share/cinnamon/applets/777@clash/icons/cross.svg");
            this.set_applet_tooltip("Kattints egy bibliai idézet megjelenítéséhez");
            this.bibleId = this.savedBibleId || 'fcfc25677b0a53c9-01';
            this.lastSuccessfulVerse = null;
            this.bibleVersions = {
                'de4e12af7f28f599-01': {
                    name: 'English (KJV)',
                    hasOT: true,
                    hasNT: true,
                    language: 'eng'
                },
                'fcfc25677b0a53c9-01': {
                    name: 'Magyar (Nyitott Újszövetség 2003)',
                    hasOT: false,
                    hasNT: true,
                    language: 'hun'
                },
                '926aa5efbc5e04e2-01': {
                    name: 'Deutsch (Luther 1912)',
                    hasOT: true,
                    hasNT: true,
                    language: 'deu'
                },
                'b32b9d1b64b4ef29-01': {
                    name: 'Español',
                    hasOT: true,
                    hasNT: true,
                    language: 'spa'
                },
                '1c9761e0230da6e0-01': {
                    name: 'Polski (UBG)',
                    hasOT: true,
                    hasNT: true,
                    language: 'pol'
                },
                '2211def87a897205-01': {
                    name: 'Slovenčina (Katolícky preklad)',
                    hasOT: true,
                    hasNT: true,
                    language: 'slk'
                },
                'c61908161b077c4c-01': {
                    name: 'Čeština (Bible Kralická)',
                    hasOT: true,
                    hasNT: true,
                    language: 'ces'
                },
                'b00de703b3d02a5a-01': {
                    name: 'Hrvatski (Biblica® New Testament 2000)',
                    hasOT: false,
                    hasNT: true,
                    language: 'hrv'
                },
                'b83db44e6dc39993-01': {
                    name: 'Српски (Ћирилица)',
                    hasOT: true,
                    hasNT: true,
                    language: 'srp'
                },
                'b183e5ae72f67c87-01': {
                    name: 'Українська (Біблія)',
                    hasOT: true,
                    hasNT: true,
                    language: 'ukr'
                },
            };

            this.localizedStrings = {
                eng: {
                    menuTitle: 'Languages',
                    loading: 'Loading...',
                    error: 'Error',
                    notFound: 'Verses not found',
                    dailyVerse: 'Daily Bible Verse',
                    languageChanged: 'Language changed to'
                },
                hun: {
                    menuTitle: 'Nyelvek',
                    loading: 'Betöltés...',
                    error: 'Hiba',
                    notFound: 'Nem találhatók versek',
                    dailyVerse: 'Napi Bibliai Idézet',
                    languageChanged: 'A kiválasztott nyelv'
                },
                deu: {
                    menuTitle: 'Sprachen',
                    loading: 'Laden...',
                    error: 'Fehler',
                    notFound: 'Keine Verse gefunden',
                    dailyVerse: 'Täglicher Bibelvers',
                    languageChanged: 'Sprache geändert zu'
                },
                spa: {
                    menuTitle: 'Idiomas',
                    loading: 'Cargando...',
                    error: 'Error',
                    notFound: 'Versículos no encontrados',
                    dailyVerse: 'Versículo Diario',
                    languageChanged: 'Idioma cambiado a'
                },
                pol: {
                    menuTitle: 'Języki',
                    loading: 'Ładowanie...',
                    error: 'Błąd',
                    notFound: 'Nie znaleziono wersetów',
                    dailyVerse: 'Werset na dziś',
                    languageChanged: 'Zmieniono język na'
                },
                slk: {
                    menuTitle: 'Jazyky',
                    loading: 'Načítavam...',
                    error: 'Chyba',
                    notFound: 'Verše neboli nájdené',
                    dailyVerse: 'Verš dňa',
                    languageChanged: 'Jazyk zmenený na'
                },
                ces: {
                    menuTitle: 'Jazyky',
                    loading: 'Načítání...',
                    error: 'Chyba',
                    notFound: 'Verše nenalezeny',
                    dailyVerse: 'Verš dne',
                    languageChanged: 'Jazyk změněn na'
                },
                hrv: {
                    menuTitle: 'Jezici',
                    loading: 'Učitavanje...',
                    error: 'Greška',
                    notFound: 'Stihovi nisu pronađeni',
                    dailyVerse: 'Stih dana',
                    languageChanged: 'Jezik promijenjen u'
                },
                srp: {
                    menuTitle: 'Језици',
                    loading: 'Учитавање...',
                    error: 'Грешка',
                    notFound: 'Стихови нису пронађени',
                    dailyVerse: 'Стих дана',
                    languageChanged: 'Језик промењен у'
                },
                ukr: {
                    menuTitle: 'Мови',
                    loading: 'Завантаження...',
                    error: 'Помилка',
                    notFound: 'Вірші не знайдено',
                    dailyVerse: 'Вірш дня',
                    languageChanged: 'Мова змінена на'
                }
            };
            this.ntBooks = {
                'MAT': { name: 'Máté', chapters: 28 },
                'MRK': { name: 'Márk', chapters: 16 },
                'LUK': { name: 'Lukács', chapters: 24 },
                'JHN': { name: 'János', chapters: 21 },
                'ACT': { name: 'Apostolok Cselekedetei', chapters: 28 },
                'ROM': { name: 'Róma', chapters: 16 },
                '1CO': { name: '1 Korinthus', chapters: 16 },
                '2CO': { name: '2 Korinthus', chapters: 13 },
                'GAL': { name: 'Galata', chapters: 6 },
                'EPH': { name: 'Efézus', chapters: 6 },
                'PHP': { name: 'Filippi', chapters: 4 },
                'COL': { name: 'Kolossé', chapters: 4 },
                '1TH': { name: '1 Thesszalonika', chapters: 5 },
                '2TH': { name: '2 Thesszalonika', chapters: 3 },
                '1TI': { name: '1 Timóteus', chapters: 6 },
                '2TI': { name: '2 Timóteus', chapters: 4 },
                'TIT': { name: 'Titusz', chapters: 3 },
                'PHM': { name: 'Filemon', chapters: 1 },
                'HEB': { name: 'Zsidók', chapters: 13 },
                'JAS': { name: 'Jakab', chapters: 5 },
                '1PE': { name: '1 Péter', chapters: 5 },
                '2PE': { name: '2 Péter', chapters: 3 },
                '1JN': { name: '1 János', chapters: 5 },
                '2JN': { name: '2 János', chapters: 1 },
                '3JN': { name: '3 János', chapters: 1 },
                'JUD': { name: 'Júdás', chapters: 1 },
                'REV': { name: 'Jelenések', chapters: 22 }
            };
            this.otBooks = {
                'GEN': { name: 'Teremtés', chapters: 50 },
                'EXO': { name: 'Kivonulás', chapters: 40 },
                'LEV': { name: 'Léviták', chapters: 27 },
                'NUM': { name: 'Számok', chapters: 36 },
                'DEU': { name: 'Második Törvénykönyv', chapters: 34 }
            };
            this.languages = {};
            for (let id in this.bibleVersions) {
                this.languages[id] = this.bibleVersions[id].name;
            }

            this._buildContextMenu();
            this._fetchVerse();
            this._startAutoFetch();
        } catch (e) {
            global.logError(e);
        }
    },

    onBibleIdChanged: function() {
        this._fetchVerse();
    },

    _getCurrentLanguage: function() {
        return this.bibleVersions[this.bibleId].language;
    },

    _getLocalizedString: function(key) {
        const lang = this._getCurrentLanguage();
        return this.localizedStrings[lang][key] || this.localizedStrings['eng'][key];
    },

    _setLoadingState: function(isLoading) {
        if (isLoading) {
            this.set_applet_icon_name("process-working");
        } else {
            this.set_applet_icon_path(GLib.get_home_dir() + "/.local/share/cinnamon/applets/777@clash/icons/cross.svg");
        }
    },

    _buildContextMenu: function() {
        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let languageSubMenu = new PopupMenu.PopupSubMenuMenuItem(this._getLocalizedString('menuTitle'));
        
        for (let bibleId in this.languages) {
            let langMenuItem = new PopupMenu.PopupMenuItem(this.languages[bibleId]);
            langMenuItem.connect('activate', Lang.bind(this, function() {
                this.bibleId = bibleId;
                this.savedBibleId = bibleId;
                this._fetchVerse();
                this._showNotification(
                    this._getLocalizedString('languageChanged'),
                    this.languages[bibleId]
                );
            }));
            languageSubMenu.menu.addMenuItem(langMenuItem);
        }

        this._applet_context_menu.addMenuItem(languageSubMenu);
    },

    on_applet_clicked: function() {
        this._fetchVerse();
    },

    _fetchVerse: function() {
        try {
            this._setLoadingState(true);
            let ntBooksArray = Object.keys(this.ntBooks);
            let otBooksArray = Object.keys(this.otBooks);
            let selectedBooks;

            if (this.bibleVersions[this.bibleId].hasOT && this.bibleVersions[this.bibleId].hasNT) {
                selectedBooks = Math.random() < 0.5 ? otBooksArray : ntBooksArray;
            } else if (this.bibleVersions[this.bibleId].hasNT) {
                selectedBooks = ntBooksArray;
            } else {
                selectedBooks = otBooksArray;
            }

            let randomBook = selectedBooks[Math.floor(Math.random() * selectedBooks.length)];
            let bookInfo = selectedBooks === ntBooksArray ? this.ntBooks[randomBook] : this.otBooks[randomBook];
            let maxChapter = bookInfo.chapters;
            let randomChapter = Math.floor(Math.random() * maxChapter) + 1;
            
            let chapterId = `${randomBook}.${randomChapter}`;
            let url = `https://api.scripture.api.bible/v1/bibles/${this.bibleId}/chapters/${chapterId}/verses`;
            
            let session = new Soup.Session();
            let message = Soup.Message.new('GET', url);
            message.request_headers.append('api-key', API_KEY);

            session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, res) => {
                try {
                    let response = session.send_and_read_finish(res);
                    let responseData = response.get_data().toString();
                    
                    global.log("API Response: " + responseData);

                    let bibleData = JSON.parse(responseData);
                    if (bibleData && bibleData.data && bibleData.data.length > 0) {
                        let randomVerse = bibleData.data[Math.floor(Math.random() * bibleData.data.length)];
                        this._fetchVerseContent(this.bibleId, randomVerse.id);
                    } else {
                        this._showNotification(
                            this._getLocalizedString('error'),
                            this._getLocalizedString('notFound')
                        );
                        this._fetchVerse();
                    }
                } catch (e) {
                    this._setLoadingState(false);
                    global.logError("API válasz feldolgozási hiba: " + e);
                    this._showNotification(
                        this._getLocalizedString('error'),
                        "Az API válasz feldolgozása sikertelen"
                    );
                }
            });
        } catch (e) {
            this._setLoadingState(false);
            global.logError(e);
            this._showNotification(
                this._getLocalizedString('error'),
                "A kérés indítása sikertelen"
            );
        }
    },

    _fetchVerseContent: function(bibleId, verseId) {
        try {
            let url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${verseId}`;
            let session = new Soup.Session();
            let message = Soup.Message.new('GET', url);
            message.request_headers.append('api-key', API_KEY);

            session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, res) => {
                try {
                    let response = session.send_and_read_finish(res);
                    let responseData = response.get_data().toString();
                    
                    global.log("API Response: " + responseData);

                    let bibleData = JSON.parse(responseData);
                    if (bibleData.data) {
                        let verseText = bibleData.data.content || "Nincs elérhető ige";
                        let reference = `${bibleData.data.reference}`;
                        let notificationTitle = this._getLocalizedString('dailyVerse');

                        let plainText = verseText.replace(/<\/?[^>]+(>|$)/g, "");
                        this.lastSuccessfulVerse = {
                            title: notificationTitle,
                            text: plainText.trim(),
                            reference: reference
                        };
                        this._showNotification(notificationTitle, `${plainText.trim()}\n\n${reference}`);
                    } else if (this.lastSuccessfulVerse) {
                        this._showNotification(
                            this.lastSuccessfulVerse.title,
                            `${this.lastSuccessfulVerse.text}\n\n${this.lastSuccessfulVerse.reference}\n\n(Utolsó sikeres lekérés)`
                        );
                    } else {
                        this._showNotification(
                            this._getLocalizedString('error'),
                            this._getLocalizedString('notFound')
                        );
                    }
                    this._setLoadingState(false);
                } catch (e) {
                    this._setLoadingState(false);
                    global.logError(e);
                    this._showNotification(
                        this._getLocalizedString('error'),
                        "Hiba az API válasz feldolgozásakor"
                    );
                }
            });
        } catch (e) {
            this._setLoadingState(false);
            global.logError(e);
            this._showNotification(
                this._getLocalizedString('error'),
                "Hiba a kérés indításakor"
            );
        }
    },

    _showNotification: function(title, message) {
        let source = new MessageTray.SystemNotificationSource();
        Main.messageTray.add(source);

        let notification = new MessageTray.Notification(source, title, message);
        notification.setTransient(false);
        source.notify(notification);
    },

    _startAutoFetch: function() {
        const interval = 24 * 60 * 60;
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, Lang.bind(this, function() {
            this._fetchVerse();
            return true; 
        }));
    },

    on_applet_removed_from_panel: function() {
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(metadata, orientation, panel_height, instance_id);
}
