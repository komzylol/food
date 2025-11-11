// API Key per OpenRouter
const OPENROUTER_API_KEY = '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Array di ricette base (verrà espanso con chiamate API)
let recipes = [];

// Ingredienti selezionati dall'utente
let selectedIngredients = [];

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    initializeRecipes();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const addBtn = document.getElementById('addIngredientBtn');
    const input = document.getElementById('ingredientInput');
    const searchBtn = document.getElementById('searchRecipesBtn');
    const testAPIBtn = document.getElementById('testAPIBtn');
    const generateRecipeBtn = document.getElementById('generateRecipeBtn');

    addBtn.addEventListener('click', addIngredient);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addIngredient();
        }
    });
    searchBtn.addEventListener('click', searchRecipes);
    testAPIBtn.addEventListener('click', testAPIKey);
    generateRecipeBtn.addEventListener('click', generateRecipeFromPreferences);

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// Switch tra tab
function switchTab(tabId) {
    // Nascondi tutti i contenuti delle tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Rimuovi active da tutti i pulsanti
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostra la tab selezionata
    document.getElementById(tabId).classList.add('active');
    
    // Attiva il pulsante corrispondente
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// Aggiungi ingrediente
function addIngredient() {
    const input = document.getElementById('ingredientInput');
    const ingredient = input.value.trim().toLowerCase();

    if (ingredient && !selectedIngredients.includes(ingredient)) {
        selectedIngredients.push(ingredient);
        renderIngredients();
        input.value = '';
        input.focus();
    }
}

// Rimuovi ingrediente
function removeIngredient(ingredient) {
    selectedIngredients = selectedIngredients.filter(ing => ing !== ingredient);
    renderIngredients();
}

// Renderizza lista ingredienti
function renderIngredients() {
    const container = document.getElementById('ingredientsList');
    container.innerHTML = '';

    selectedIngredients.forEach(ingredient => {
        const tag = document.createElement('div');
        tag.className = 'ingredient-tag';
        tag.innerHTML = `
            <span>${ingredient}</span>
            <button class="remove-btn" onclick="removeIngredient('${ingredient}')">×</button>
        `;
        container.appendChild(tag);
    });
}

// Inizializza ricette usando OpenRouter API
async function initializeRecipes() {
    // Carica sempre le ricette predefinite come base
    recipes = getDefaultRecipes();
    
    try {
        // Prova a generare ricette aggiuntive usando OpenRouter (opzionale)
        const generatedRecipes = await generateRecipesWithAPI();
        // Aggiungi le ricette generate a quelle predefinite
        recipes = [...recipes, ...generatedRecipes];
    } catch (error) {
        console.error('Errore nel caricamento ricette API:', error);
        // Continua con solo le ricette predefinite
        console.log('Utilizzo ricette predefinite:', recipes.length);
    }
}

// Genera ricette usando OpenRouter API
async function generateRecipesWithAPI() {
    const prompt = `Genera 6 ricette italiane in formato JSON. Ogni ricetta deve avere:
- nome: stringa
- ingredienti: array di stringhe (almeno 3-5 ingredienti)
- tempoPreparazione: numero (in minuti)
- immagine: URL da Unsplash (formato: https://source.unsplash.com/400x300/?[nome ricetta])

Formato JSON:
[
  {
    "nome": "Nome Ricetta",
    "ingredienti": ["ingrediente1", "ingrediente2", "ingrediente3"],
    "tempoPreparazione": 30,
    "immagine": "https://source.unsplash.com/400x300/?pasta"
  }
]

Ricette da creare: Pasta al pomodoro, Frittata di uova, Pancake, Insalata mista, Riso con verdure, Pizza margherita.
Rispondi SOLO con il JSON, senza testo aggiuntivo.`;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FrigoChef'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error('Errore nella chiamata API');
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Estrai JSON dalla risposta
        let jsonContent = content;
        if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
        }

        const parsedRecipes = JSON.parse(jsonContent);
        return parsedRecipes.map(recipe => ({
            nome: recipe.nome,
            ingredienti: recipe.ingredienti.map(ing => ing.toLowerCase()),
            tempoPreparazione: recipe.tempoPreparazione,
            immagine: recipe.immagine || `https://source.unsplash.com/400x300/?${recipe.nome.toLowerCase().replace(/\s+/g, '-')}`
        }));
    } catch (error) {
        console.error('Errore API:', error);
        return getDefaultRecipes();
    }
}

// Ricette predefinite
function getDefaultRecipes() {
    return [
        {
            nome: "Pasta al pomodoro",
            ingredienti: ["pasta", "pomodoro", "aglio", "olio", "basilico", "sale"],
            tempoPreparazione: 20,
            immagine: "https://source.unsplash.com/400x300/?pasta-tomato"
        },
        {
            nome: "Frittata di uova",
            ingredienti: ["uova", "sale", "pepe", "olio"],
            tempoPreparazione: 15,
            immagine: "https://source.unsplash.com/400x300/?omelette"
        },
        {
            nome: "Pancake",
            ingredienti: ["farina", "uova", "latte", "zucchero", "burro"],
            tempoPreparazione: 25,
            immagine: "https://source.unsplash.com/400x300/?pancakes"
        },
        {
            nome: "Insalata mista",
            ingredienti: ["lattuga", "pomodoro", "carota", "olio", "aceto"],
            tempoPreparazione: 10,
            immagine: "https://source.unsplash.com/400x300/?salad"
        },
        {
            nome: "Riso con verdure",
            ingredienti: ["riso", "zucchine", "carote", "olio", "sale"],
            tempoPreparazione: 30,
            immagine: "https://source.unsplash.com/400x300/?rice-vegetables"
        },
        {
            nome: "Pizza margherita",
            ingredienti: ["farina", "pomodoro", "mozzarella", "basilico", "olio", "sale"],
            tempoPreparazione: 45,
            immagine: "https://source.unsplash.com/400x300/?pizza-margherita"
        },
        {
            nome: "Spaghetti aglio e olio",
            ingredienti: ["pasta", "aglio", "olio", "peperoncino", "prezzemolo", "sale"],
            tempoPreparazione: 15,
            immagine: "https://source.unsplash.com/400x300/?spaghetti-garlic"
        },
        {
            nome: "Risotto ai funghi",
            ingredienti: ["riso", "funghi", "cipolla", "vino bianco", "brodo", "parmigiano", "burro"],
            tempoPreparazione: 35,
            immagine: "https://source.unsplash.com/400x300/?risotto-mushroom"
        },
        {
            nome: "Carbonara",
            ingredienti: ["pasta", "uova", "guanciale", "pecorino", "pepe nero"],
            tempoPreparazione: 20,
            immagine: "https://source.unsplash.com/400x300/?carbonara"
        },
        {
            nome: "Lasagne al forno",
            ingredienti: ["pasta lasagne", "carne macinata", "pomodoro", "besciamella", "mozzarella", "parmigiano"],
            tempoPreparazione: 60,
            immagine: "https://source.unsplash.com/400x300/?lasagna"
        },
        {
            nome: "Minestrone",
            ingredienti: ["pomodoro", "zucchine", "carote", "patate", "fagioli", "pasta", "olio", "sale"],
            tempoPreparazione: 40,
            immagine: "https://source.unsplash.com/400x300/?minestrone"
        },
        {
            nome: "Pollo alla griglia",
            ingredienti: ["pollo", "olio", "sale", "pepe", "limone", "rosmarino"],
            tempoPreparazione: 30,
            immagine: "https://source.unsplash.com/400x300/?grilled-chicken"
        },
        {
            nome: "Pasta alla puttanesca",
            ingredienti: ["pasta", "pomodoro", "olive", "capperi", "acciughe", "aglio", "olio"],
            tempoPreparazione: 20,
            immagine: "https://source.unsplash.com/400x300/?puttanesca"
        },
        {
            nome: "Zuppa di legumi",
            ingredienti: ["lenticchie", "fagioli", "carote", "sedano", "cipolla", "pomodoro", "olio"],
            tempoPreparazione: 45,
            immagine: "https://source.unsplash.com/400x300/?legume-soup"
        },
        {
            nome: "Gnocchi al pomodoro",
            ingredienti: ["gnocchi", "pomodoro", "basilico", "aglio", "olio", "parmigiano"],
            tempoPreparazione: 25,
            immagine: "https://source.unsplash.com/400x300/?gnocchi"
        },
        {
            nome: "Penne all'arrabbiata",
            ingredienti: ["pasta", "pomodoro", "aglio", "peperoncino", "olio", "prezzemolo"],
            tempoPreparazione: 20,
            immagine: "https://source.unsplash.com/400x300/?pasta-arrabiata"
        },
        {
            nome: "Pasta al pesto",
            ingredienti: ["pasta", "basilico", "pinoli", "aglio", "parmigiano", "olio"],
            tempoPreparazione: 15,
            immagine: "https://source.unsplash.com/400x300/?pesto-pasta"
        },
        {
            nome: "Polpette al sugo",
            ingredienti: ["carne macinata", "pane", "uova", "pomodoro", "cipolla", "parmigiano"],
            tempoPreparazione: 50,
            immagine: "https://source.unsplash.com/400x300/?meatballs"
        },
        {
            nome: "Pasta e fagioli",
            ingredienti: ["pasta", "fagioli", "pomodoro", "aglio", "olio", "sedano", "carote"],
            tempoPreparazione: 35,
            immagine: "https://source.unsplash.com/400x300/?pasta-fagioli"
        },
        {
            nome: "Bruschetta",
            ingredienti: ["pane", "pomodoro", "aglio", "basilico", "olio", "sale"],
            tempoPreparazione: 10,
            immagine: "https://source.unsplash.com/400x300/?bruschetta"
        },
        {
            nome: "Insalata caprese",
            ingredienti: ["pomodoro", "mozzarella", "basilico", "olio", "sale", "pepe"],
            tempoPreparazione: 10,
            immagine: "https://source.unsplash.com/400x300/?caprese-salad"
        },
        {
            nome: "Pasta cacio e pepe",
            ingredienti: ["pasta", "pecorino", "pepe nero"],
            tempoPreparazione: 15,
            immagine: "https://source.unsplash.com/400x300/?cacio-e-pepe"
        },
        {
            nome: "Frittata con zucchine",
            ingredienti: ["uova", "zucchine", "cipolla", "olio", "sale", "pepe"],
            tempoPreparazione: 20,
            immagine: "https://source.unsplash.com/400x300/?zucchini-omelette"
        },
        {
            nome: "Pasta al tonno",
            ingredienti: ["pasta", "tonno", "pomodoro", "aglio", "olio", "capperi"],
            tempoPreparazione: 20,
            immagine: "https://source.unsplash.com/400x300/?tuna-pasta"
        },
        {
            nome: "Risotto ai pomodori",
            ingredienti: ["riso", "pomodoro", "cipolla", "brodo", "parmigiano", "basilico"],
            tempoPreparazione: 30,
            immagine: "https://source.unsplash.com/400x300/?tomato-risotto"
        },
        {
            nome: "Pasta al limone",
            ingredienti: ["pasta", "limone", "burro", "parmigiano", "pepe"],
            tempoPreparazione: 15,
            immagine: "https://source.unsplash.com/400x300/?lemon-pasta"
        },
        {
            nome: "Pasta e ceci",
            ingredienti: ["pasta", "ceci", "pomodoro", "aglio", "rosmarino", "olio"],
            tempoPreparazione: 30,
            immagine: "https://source.unsplash.com/400x300/?pasta-chickpeas"
        },
        {
            nome: "Pasta alla norma",
            ingredienti: ["pasta", "melanzane", "pomodoro", "basilico", "ricotta", "olio"],
            tempoPreparazione: 35,
            immagine: "https://source.unsplash.com/400x300/?pasta-norma"
        },
        {
            nome: "Pasta con broccoli",
            ingredienti: ["pasta", "broccoli", "aglio", "olio", "peperoncino"],
            tempoPreparazione: 25,
            immagine: "https://source.unsplash.com/400x300/?broccoli-pasta"
        },
        {
            nome: "Pasta e piselli",
            ingredienti: ["pasta", "piselli", "pancetta", "cipolla", "olio"],
            tempoPreparazione: 25,
            immagine: "https://source.unsplash.com/400x300/?pasta-peas"
        },
        {
            nome: "Pasta con le sarde",
            ingredienti: ["pasta", "sarde", "finocchietto", "pinoli", "uvetta", "olio"],
            tempoPreparazione: 30,
            immagine: "https://source.unsplash.com/400x300/?pasta-sardines"
        }
    ];
}

// Testa la API Key
async function testAPIKey() {
    const testBtn = document.getElementById('testAPIBtn');
    const testResult = document.getElementById('apiTestResult');
    
    // Disabilita il pulsante durante il test
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> Testando...';
    testResult.classList.remove('hidden');
    testResult.innerHTML = '<div class="loading">Testando la connessione API...</div>';

    try {
        // Test con una richiesta semplice
        const testPrompt = `Genera UNA ricetta italiana semplice in formato JSON usando principalmente questi ingredienti: uova, farina. 
La ricetta deve avere:
- nome: stringa
- ingredienti: array di stringhe (include almeno uova e farina, aggiungi altri ingredienti comuni)
- tempoPreparazione: numero (in minuti)
- immagine: URL da Unsplash (formato: https://source.unsplash.com/400x300/?[nome ricetta])

Rispondi SOLO con il JSON, senza testo aggiuntivo.`;

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FrigoChef'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: testPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Estrai JSON dalla risposta
        let jsonContent = content;
        if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
        }

        const parsedRecipe = JSON.parse(jsonContent);
        const formattedRecipe = {
            nome: parsedRecipe.nome || parsedRecipe[0]?.nome,
            ingredienti: (parsedRecipe.ingredienti || parsedRecipe[0]?.ingredienti || []).map(ing => ing.toLowerCase()),
            tempoPreparazione: parsedRecipe.tempoPreparazione || parsedRecipe[0]?.tempoPreparazione || 20,
            immagine: parsedRecipe.immagine || parsedRecipe[0]?.immagine || 'https://source.unsplash.com/400x300/?food'
        };

        // Mostra successo con la ricetta generata
        testResult.innerHTML = `
            <div class="api-test-success">
                <h3><i class="fas fa-check"></i> API Key funziona correttamente!</h3>
                <p>Ricetta di test generata:</p>
                <div class="test-recipe-card">
                    <h4>${formattedRecipe.nome}</h4>
                    <p><strong>Ingredienti:</strong> ${formattedRecipe.ingredienti.join(', ')}</p>
                    <p><strong>Tempo:</strong> ${formattedRecipe.tempoPreparazione} minuti</p>
                </div>
            </div>
        `;
        testBtn.innerHTML = '<i class="fas fa-check"></i> API Key Testata';
        
        // Reset dopo 3 secondi
        setTimeout(() => {
            testBtn.innerHTML = '<i class="fas fa-key"></i> Testa API Key';
            testBtn.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('Errore test API:', error);
        testResult.innerHTML = `
            <div class="api-test-error">
                <h3><i class="fas fa-times"></i> Errore nel test dell'API</h3>
                <p><strong>Messaggio:</strong> ${error.message}</p>
                <p>Verifica che la API key sia corretta e che il servizio OpenRouter sia disponibile.</p>
            </div>
        `;
        testBtn.innerHTML = '<i class="fas fa-times"></i> Test Fallito';
        testBtn.disabled = false;
    }
}

// Genera ricetta personalizzata usando l'API in base agli ingredienti disponibili
async function generateRecipeFromIngredients(userIngredients) {
    const ingredientsList = userIngredients.length > 0 
        ? userIngredients.join(', ')
        : 'ingredienti base comuni (uova, farina, sale, olio)';

    const prompt = `Genera UNA ricetta italiana in formato JSON usando principalmente questi ingredienti: ${ingredientsList}. 
La ricetta deve essere creativa e utilizzare il più possibile gli ingredienti forniti, aggiungendo altri ingredienti comuni se necessario.
Formato JSON:
{
  "nome": "Nome Ricetta",
  "ingredienti": ["ingrediente1", "ingrediente2", "ingrediente3"],
  "tempoPreparazione": 30,
  "immagine": "https://source.unsplash.com/400x300/?[parole chiave per immagine cibo, separate da virgola]"
}

IMPORTANTE: Per il campo "immagine", genera un URL Unsplash con parole chiave specifiche e rilevanti per la ricetta. 
Usa parole chiave in inglese che descrivono il piatto (es: "pasta,tomato,basil" per pasta al pomodoro, o "omelette,eggs" per frittata).
Il formato deve essere: https://source.unsplash.com/400x300/?parola1,parola2,parola3
Rispondi SOLO con il JSON, senza testo aggiuntivo.`;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FrigoChef'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            throw new Error('Errore nella chiamata API');
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Estrai JSON dalla risposta
        let jsonContent = content;
        if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
        }

        const parsedRecipe = JSON.parse(jsonContent);
        const recipeName = parsedRecipe.nome || parsedRecipe[0]?.nome;
        const recipeImage = parsedRecipe.immagine || parsedRecipe[0]?.immagine;
        
        // Se l'immagine non è stata generata o non è valida, crea un URL basato sul nome
        let finalImage = recipeImage;
        if (!finalImage || !finalImage.includes('unsplash.com')) {
            const keywords = (recipeName || 'italian food').toLowerCase()
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[ç]/g, 'c')
                .split(/\s+/)
                .slice(0, 3)
                .join(',');
            finalImage = `https://source.unsplash.com/400x300/?${keywords},food,italian`;
        }
        
        const formattedRecipe = {
            nome: recipeName,
            ingredienti: (parsedRecipe.ingredienti || parsedRecipe[0]?.ingredienti || []).map(ing => ing.toLowerCase()),
            tempoPreparazione: parsedRecipe.tempoPreparazione || parsedRecipe[0]?.tempoPreparazione || 20,
            immagine: finalImage
        };

        return formattedRecipe;
    } catch (error) {
        console.error('Errore generazione ricetta:', error);
        return null;
    }
}

// Genera multiple ricette usando AI basate sugli ingredienti
async function generateMultipleRecipesFromIngredients(userIngredients, count = 5) {
    const ingredientsList = userIngredients.join(', ');

    const prompt = `Genera ${count} ricette italiane diverse e creative in formato JSON usando principalmente questi ingredienti: ${ingredientsList}. 
Ogni ricetta deve essere unica, creativa e utilizzare il più possibile gli ingredienti forniti, aggiungendo altri ingredienti comuni se necessario.
Le ricette devono essere pratiche, realizzabili e appetitose.

Formato JSON:
[
  {
    "nome": "Nome Ricetta 1",
    "ingredienti": ["ingrediente1", "ingrediente2", "ingrediente3"],
    "tempoPreparazione": 30,
    "immagine": "https://source.unsplash.com/400x300/?[parole chiave]",
    "descrizione": "Breve descrizione della ricetta"
  },
  {
    "nome": "Nome Ricetta 2",
    ...
  }
]

IMPORTANTE: 
- Per ogni ricetta, genera un URL Unsplash con parole chiave specifiche in inglese (es: "pasta,tomato,basil").
- Le ricette devono essere diverse tra loro (non ripetere lo stesso tipo di piatto).
- Ogni ricetta deve essere sensata e utilizzare principalmente gli ingredienti forniti.
- La descrizione deve essere breve (1-2 frasi) e descrivere il piatto.

Rispondi SOLO con il JSON, senza testo aggiuntivo.`;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FrigoChef'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.9,
                max_tokens: 2500
            })
        });

        if (!response.ok) {
            throw new Error('Errore nella chiamata API');
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Estrai JSON dalla risposta
        let jsonContent = content;
        if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
        }

        const parsedRecipes = JSON.parse(jsonContent);
        const recipesArray = Array.isArray(parsedRecipes) ? parsedRecipes : [parsedRecipes];
        
        return recipesArray.map(recipe => {
            const recipeName = recipe.nome || recipe[0]?.nome;
            const recipeImage = recipe.immagine || recipe[0]?.immagine;
            
            // Se l'immagine non è stata generata, crea un URL basato sul nome
            let finalImage = recipeImage;
            if (!finalImage || !finalImage.includes('unsplash.com')) {
                const keywords = (recipeName || 'italian food').toLowerCase()
                    .replace(/[àáâãäå]/g, 'a')
                    .replace(/[èéêë]/g, 'e')
                    .replace(/[ìíîï]/g, 'i')
                    .replace(/[òóôõö]/g, 'o')
                    .replace(/[ùúûü]/g, 'u')
                    .replace(/[ç]/g, 'c')
                    .split(/\s+/)
                    .slice(0, 3)
                    .join(',');
                finalImage = `https://source.unsplash.com/400x300/?${keywords},food,italian`;
            }
            
            return {
                nome: recipeName,
                ingredienti: (recipe.ingredienti || []).map(ing => ing.toLowerCase()),
                tempoPreparazione: recipe.tempoPreparazione || 30,
                immagine: finalImage,
                descrizione: recipe.descrizione || '',
                isGenerated: true
            };
        });
    } catch (error) {
        console.error('Errore generazione ricette:', error);
        return null;
    }
}

// Cerca ricette compatibili
async function searchRecipes() {
    const resultsSection = document.getElementById('resultsSection');
    const emptyState = document.getElementById('emptyState');
    const container = document.getElementById('recipesContainer');

    // Nascondi tutte le sezioni prima di iniziare
    resultsSection.classList.add('hidden');
    emptyState.classList.add('hidden');
    
    // Mostra loading solo una volta
    container.innerHTML = '<div class="loading">Generando ricette personalizzate con AI...</div>';
    resultsSection.classList.remove('hidden');

    let compatibleRecipes = [];

    // Se ci sono ingredienti, genera sempre ricette con AI
    if (selectedIngredients.length > 0) {
        try {
            // Genera 5 ricette diverse con AI
            const aiRecipes = await generateMultipleRecipesFromIngredients(selectedIngredients, 5);
            
            if (aiRecipes && aiRecipes.length > 0) {
                // Calcola compatibilità per ogni ricetta generata
                compatibleRecipes = aiRecipes.map(recipe => {
                    const commonIngredients = recipe.ingredienti.filter(ing => 
                        selectedIngredients.includes(ing)
                    );
                    const compatibility = (commonIngredients.length / recipe.ingredienti.length) * 100;
                    
                    return {
                        ...recipe,
                        compatibility: Math.round(compatibility),
                        commonIngredients: commonIngredients,
                        isGenerated: true
                    };
                }).sort((a, b) => b.compatibility - a.compatibility);
            } else {
                // Fallback: usa le ricette predefinite se l'AI non funziona
                const recipesWithCompatibility = recipes.map(recipe => {
                    const commonIngredients = recipe.ingredienti.filter(ing => 
                        selectedIngredients.includes(ing)
                    );
                    const compatibility = (commonIngredients.length / recipe.ingredienti.length) * 100;
                    
                    return {
                        ...recipe,
                        compatibility: Math.round(compatibility),
                        commonIngredients: commonIngredients
                    };
                });

                compatibleRecipes = recipesWithCompatibility
                    .filter(recipe => recipe.compatibility > 0)
                    .sort((a, b) => b.compatibility - a.compatibility);
            }
        } catch (error) {
            console.error('Errore nella generazione ricette AI:', error);
            // Fallback alle ricette predefinite in caso di errore
            const recipesWithCompatibility = recipes.map(recipe => {
                const commonIngredients = recipe.ingredienti.filter(ing => 
                    selectedIngredients.includes(ing)
                );
                const compatibility = (commonIngredients.length / recipe.ingredienti.length) * 100;
                
                return {
                    ...recipe,
                    compatibility: Math.round(compatibility),
                    commonIngredients: commonIngredients
                };
            });

            compatibleRecipes = recipesWithCompatibility
                .filter(recipe => recipe.compatibility > 0)
                .sort((a, b) => b.compatibility - a.compatibility);
        }
    } else {
        // Se non ci sono ingredienti, mostra ricette predefinite ordinate casualmente
        compatibleRecipes = recipes.map(recipe => ({
            ...recipe,
            compatibility: 0,
            commonIngredients: []
        })).sort(() => Math.random() - 0.5);
    }

    // Renderizza solo alla fine, dopo aver raccolto tutti i dati
    setTimeout(() => {
        if (compatibleRecipes.length === 0) {
            resultsSection.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            renderRecipes(compatibleRecipes);
            resultsSection.classList.remove('hidden');
            emptyState.classList.add('hidden');
        }
    }, 50);
}

// Renderizza ricette
function renderRecipes(recipes) {
    const container = document.getElementById('recipesContainer');
    container.innerHTML = '';

    recipes.forEach((recipe, index) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        if (recipe.isGenerated) {
            card.classList.add('generated-recipe');
        }

        const ingredientsList = recipe.ingredienti.map(ing => {
            const hasIngredient = selectedIngredients.includes(ing);
            return `<span class="ingredient-item ${hasIngredient ? 'has-ingredient' : ''}">${ing}</span>`;
        }).join('');

        const generatedBadge = recipe.isGenerated ? '<span class="ai-badge"><i class="fas fa-magic"></i> Generata con AI</span>' : '';
        const descriptionHTML = recipe.descrizione 
            ? `<div class="recipe-description">${recipe.descrizione}</div>` 
            : '';

        card.innerHTML = `
            <div class="recipe-content">
                <div class="recipe-header">
                    <div class="recipe-title-section">
                        <h3 class="recipe-name">${recipe.nome}</h3>
                        <div class="recipe-meta">
                            <span class="recipe-time"><i class="fas fa-clock"></i> ${recipe.tempoPreparazione} min</span>
                        </div>
                    </div>
                    <div class="recipe-badges">
                        <span class="compatibility-badge">${recipe.compatibility}% match</span>
                        ${generatedBadge}
                    </div>
                </div>
                ${descriptionHTML}
                <div class="recipe-ingredients">
                    <h4><i class="fas fa-shopping-basket"></i> Ingredienti</h4>
                    <div class="ingredients-list">
                        ${ingredientsList}
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
        
        // Attiva l'animazione dopo un breve delay
        setTimeout(() => {
            card.style.opacity = '1';
        }, index * 100);
    });
}

// Genera ricetta basata sulle preferenze dell'utente
async function generateRecipeFromPreferences() {
    const loadingSection = document.getElementById('preferencesLoading');
    const resultsSection = document.getElementById('preferencesResultsSection');
    const container = document.getElementById('preferencesRecipesContainer');
    const generateBtn = document.getElementById('generateRecipeBtn');

    // Raccogli le preferenze
    const cuisineType = document.getElementById('cuisineType').value;
    const mealType = document.getElementById('mealType').value;
    const cookingTime = document.getElementById('cookingTime').value;
    const preferredIngredients = document.getElementById('preferredIngredients').value.trim();
    const additionalPreferences = document.getElementById('additionalPreferences').value.trim();
    
    // Raccogli restrizioni dietetiche
    const dietaryRestrictions = [];
    if (document.getElementById('vegetarian').checked) dietaryRestrictions.push('vegetariano');
    if (document.getElementById('vegan').checked) dietaryRestrictions.push('vegano');
    if (document.getElementById('glutenFree').checked) dietaryRestrictions.push('senza glutine');
    if (document.getElementById('dairyFree').checked) dietaryRestrictions.push('senza latticini');

    // Nascondi tutto all'inizio per evitare flickering
    loadingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    
    // Pulisci il container prima di iniziare
    container.innerHTML = '';
    
    // Mostra loading
    loadingSection.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> Generando...';

    // Costruisci il prompt per l'API
    let prompt = `Genera una ricetta personalizzata in formato JSON basata sulle seguenti preferenze:\n\n`;

    if (cuisineType) {
        prompt += `- Tipo di cucina: ${cuisineType}\n`;
    }
    if (mealType) {
        prompt += `- Tipo di pasto: ${mealType}\n`;
    }
    if (dietaryRestrictions.length > 0) {
        prompt += `- Restrizioni dietetiche: ${dietaryRestrictions.join(', ')}\n`;
    }
    if (preferredIngredients) {
        prompt += `- Ingredienti preferiti: ${preferredIngredients}\n`;
    }
    if (cookingTime) {
        prompt += `- Tempo massimo di preparazione: ${cookingTime} minuti\n`;
    }
    if (additionalPreferences) {
        prompt += `- Altre preferenze: ${additionalPreferences}\n`;
    }

    prompt += `\nFormato JSON richiesto:
{
  "nome": "Nome della Ricetta",
  "ingredienti": ["ingrediente1", "ingrediente2", "ingrediente3"],
  "tempoPreparazione": 30,
  "immagine": "https://source.unsplash.com/400x300/?[parole chiave per immagine cibo]",
  "descrizione": "Breve descrizione della ricetta (2-3 frasi)",
  "istruzioni": [
    "Passo 1: descrizione dettagliata del primo passaggio",
    "Passo 2: descrizione dettagliata del secondo passaggio",
    "Passo 3: descrizione dettagliata del terzo passaggio",
    "..."
  ]
}

IMPORTANTE: 
- Per il campo "immagine", genera un URL Unsplash con parole chiave specifiche e rilevanti per la ricetta.
  Usa parole chiave in inglese che descrivono il piatto (es: "pasta,tomato,italian" per pasta al pomodoro).
  Il formato deve essere: https://source.unsplash.com/400x300/?parola1,parola2,parola3
- Per il campo "istruzioni", fornisci una lista completa e dettagliata di tutti i passaggi necessari per preparare la ricetta.
  Ogni passaggio deve essere chiaro, sequenziale e facile da seguire. Include almeno 4-6 passaggi.
La ricetta deve essere creativa, appetitosa e rispettare tutte le preferenze indicate. 
Rispondi SOLO con il JSON, senza testo aggiuntivo.`;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FrigoChef'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.9,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error('Errore nella chiamata API');
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Estrai JSON dalla risposta
        let jsonContent = content;
        if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
        }

        const parsedRecipe = JSON.parse(jsonContent);
        const recipeName = parsedRecipe.nome || parsedRecipe[0]?.nome;
        const recipeImage = parsedRecipe.immagine || parsedRecipe[0]?.immagine;
        
        // Se l'immagine non è stata generata o non è valida, crea un URL basato sul nome
        let finalImage = recipeImage;
        if (!finalImage || !finalImage.includes('unsplash.com')) {
            const keywords = (recipeName || 'italian food').toLowerCase()
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[ç]/g, 'c')
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 2)
                .slice(0, 3)
                .join(',');
            finalImage = `https://source.unsplash.com/400x300/?${keywords},food`;
        }
        
        const formattedRecipe = {
            nome: recipeName,
            ingredienti: (parsedRecipe.ingredienti || parsedRecipe[0]?.ingredienti || []).map(ing => ing.toLowerCase()),
            tempoPreparazione: parsedRecipe.tempoPreparazione || parsedRecipe[0]?.tempoPreparazione || 30,
            immagine: finalImage,
            descrizione: parsedRecipe.descrizione || parsedRecipe[0]?.descrizione || '',
            istruzioni: parsedRecipe.istruzioni || parsedRecipe[0]?.istruzioni || [],
            isGenerated: true,
            compatibility: 100
        };

        // Renderizza tutto in un unico passaggio per evitare flickering
        // Usa un piccolo delay per permettere al browser di completare il rendering
        setTimeout(() => {
            loadingSection.classList.add('hidden');
            renderPreferencesRecipe(formattedRecipe);
            resultsSection.classList.remove('hidden');
            
            // Scrolla alla sezione risultati dopo un breve delay
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }, 50);

    } catch (error) {
        console.error('Errore generazione ricetta:', error);
        // Renderizza l'errore in un unico passaggio
        setTimeout(() => {
            loadingSection.classList.add('hidden');
            container.innerHTML = `
                <div class="api-test-error">
                    <h3><i class="fas fa-times"></i> Errore nella generazione</h3>
                    <p>Si è verificato un errore durante la generazione della ricetta. Riprova più tardi.</p>
                    <p><strong>Dettagli:</strong> ${error.message}</p>
                </div>
            `;
            resultsSection.classList.remove('hidden');
        }, 50);
    } finally {
        // Reset del pulsante dopo un breve delay per assicurare che il rendering sia completato
        setTimeout(() => {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Genera Ricetta';
        }, 100);
    }
}

// Renderizza la ricetta generata dalle preferenze
function renderPreferencesRecipe(recipe) {
    const container = document.getElementById('preferencesRecipesContainer');
    container.innerHTML = '';

    const ingredientsList = recipe.ingredienti.map(ing => {
        return `<span class="ingredient-item">${ing}</span>`;
    }).join('');

    const descriptionHTML = recipe.descrizione 
        ? `<div class="recipe-description">${recipe.descrizione}</div>` 
        : '';

    // Crea la lista delle istruzioni
    let instructionsHTML = '';
    if (recipe.istruzioni && recipe.istruzioni.length > 0) {
        instructionsHTML = `
            <div class="recipe-instructions">
                <h4><i class="fas fa-list-ol"></i> Istruzioni:</h4>
                <ol class="instructions-list">
                    ${recipe.istruzioni.map((step, index) => {
                        // Rimuovi "Passo X:" se presente all'inizio
                        const cleanStep = step.replace(/^Passo\s*\d+[:\s]*/i, '').trim();
                        return `<li class="instruction-step">${cleanStep}</li>`;
                    }).join('')}
                </ol>
            </div>
        `;
    }

    const card = document.createElement('div');
    card.className = 'recipe-card generated-recipe full-recipe';
    card.style.opacity = '0';
    card.innerHTML = `
        <div class="recipe-content">
            <div class="recipe-header">
                <div class="recipe-title-section">
                    <h3 class="recipe-name">${recipe.nome}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-time"><i class="fas fa-clock"></i> ${recipe.tempoPreparazione} minuti</span>
                    </div>
                </div>
                <span class="ai-badge"><i class="fas fa-magic"></i> Personalizzata per te</span>
            </div>
            ${descriptionHTML}
            <div class="recipe-ingredients">
                <h4><i class="fas fa-shopping-basket"></i> Ingredienti</h4>
                <div class="ingredients-list">
                    ${ingredientsList}
                </div>
            </div>
            ${instructionsHTML}
        </div>
    `;

    container.appendChild(card);
    
    // Attiva l'animazione dopo il rendering
    setTimeout(() => {
        card.style.opacity = '1';
    }, 50);
}

// Esponi funzione removeIngredient globalmente per gli onclick
window.removeIngredient = removeIngredient;

