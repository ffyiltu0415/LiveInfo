// Card Database Preset Initializer
const DEFAULT_INITIAL_CARDS = 10;
let cardIdCounter = 0;

// Application State
const state = {
    activeTab: 'tab-deck',
    tier: 15,
    nightmare: false,
    
    // Interactive Simulator State
    deck: [],
    ops: {
        delete: 0,
        duplicate: 0,
        transform: 0
    },
    deletedPenaltiesCount: 0, // Count of deleted initial or inspiration cards
    
    // Quick Calculator State (synced from input elements)
    quickCalc: {
        initialCount: 10,
        neutralCount: 0,
        monsterCount: 0,
        forbiddenCount: 0,
        ordinaryInsp: 0,
        divineInsp: 0,
        sparklyCount: 0,
        deleteOps: 0,
        deletePenalties: 0,
        duplicateOps: 0,
        transformOps: 0
    }
};

// UI Elements
const dom = {
    tierSelect: document.getElementById('tier-select'),
    nightmareToggle: document.getElementById('nightmare-toggle'),
    displayCurrentPt: document.getElementById('display-current-pt'),
    displayLimitPt: document.getElementById('display-limit-pt'),
    ptProgressBar: document.getElementById('pt-progress-bar'),
    ptStatusBadge: document.getElementById('pt-status-badge'),
    
    // Indicators
    indCardsBase: document.getElementById('ind-cards-base'),
    indOperations: document.getElementById('ind-operations'),
    indPenalties: document.getElementById('ind-penalties'),
    
    // Counter Display
    valDeleteCount: document.getElementById('val-delete-count'),
    valDuplicateCount: document.getElementById('val-duplicate-count'),
    valTransformCount: document.getElementById('val-transform-count'),
    
    // Counter Buttons
    btnDeleteMinus: document.getElementById('btn-delete-minus'),
    btnDeletePlus: document.getElementById('btn-delete-plus'),
    btnDuplicateMinus: document.getElementById('btn-duplicate-minus'),
    btnDuplicatePlus: document.getElementById('btn-duplicate-plus'),
    btnTransformMinus: document.getElementById('btn-transform-minus'),
    btnTransformPlus: document.getElementById('btn-transform-plus'),
    
    // Form Inputs
    addCardType: document.getElementById('add-card-type'),
    addCardInspiration: document.getElementById('add-card-inspiration'),
    addCardSparkly: document.getElementById('add-card-sparkly'),
    btnAddCard: document.getElementById('btn-add-card'),
    
    // Deck grid & size
    deckGrid: document.getElementById('deck-grid'),
    deckSize: document.getElementById('deck-size'),
    
    // Deck Actions
    btnResetDeck: document.getElementById('btn-reset-deck'),
    btnClearAll: document.getElementById('btn-clear-all'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnImportJson: document.getElementById('btn-import-json'),
    
    // Suggestions & breakdown
    analysisSuggestions: document.getElementById('analysis-suggestions'),
    ptBreakdownList: document.getElementById('pt-breakdown-list'),
    
    // Tab Headers
    tabHeaders: document.querySelectorAll('.tab-header'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Modal
    jsonModal: document.getElementById('json-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalTextarea: document.getElementById('modal-textarea'),
    btnModalClose: document.getElementById('btn-modal-close'),
    btnModalAction: document.getElementById('btn-modal-action')
};

// Initialize dropdown options for Tier (1-15)
function initTiers() {
    dom.tierSelect.innerHTML = '';
    for (let i = 1; i <= 15; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Tier ${i} (上限 ${(i + 2) * 10} PT)`;
        if (i === 15) option.selected = true;
        dom.tierSelect.appendChild(option);
    }
    state.tier = 15;
}

// Formula: Deletion / Duplication incremental cost
function calculateIncrementalCost(count) {
    if (count <= 1) return 0;
    if (count === 2) return 10;
    if (count === 3) return 30;
    if (count === 4) return 50;
    if (count === 5) return 70;
    return 70 + (count - 5) * 20; // +20 per step after 5
}

// Generate Default Starter Deck
function generateDefaultDeck() {
    state.deck = [];
    state.ops = { delete: 0, duplicate: 0, transform: 0 };
    state.deletedPenaltiesCount = 0;
    
    for (let i = 0; i < DEFAULT_INITIAL_CARDS; i++) {
        cardIdCounter++;
        state.deck.push({
            id: cardIdCounter,
            name: `初始基本卡 #${i + 1}`,
            type: 'initial',
            inspiration: 'none',
            sparkly: false,
            removeTalent: false // Checkbox for remove talent
        });
    }
}

// Calculate total PT based on active mode
function updatePT() {
    let currentPt = 0;
    let limitPt = (parseInt(state.tier) + 2) * 10 + (state.nightmare ? 10 : 0);
    
    let breakdown = {};
    let suggestions = [];
    
    if (state.activeTab === 'tab-calculator') {
        // Quick Calculator Calculations
        const qc = state.quickCalc;
        
        const initialPt = qc.initialCount * 0;
        const neutralPt = qc.neutralCount * 20;
        const monsterPt = qc.monsterCount * 80;
        const forbiddenPt = qc.forbiddenCount * 20;
        const baseCardsPt = initialPt + neutralPt + monsterPt + forbiddenPt;
        
        const inspPt = (qc.ordinaryInsp * 10) + (qc.divineInsp * 20);
        const sparklyPt = qc.sparklyCount * 10;
        
        const deleteOpsPt = calculateIncrementalCost(qc.deleteOps);
        const deletePenaltiesPt = qc.deletePenalties * 20;
        const duplicateOpsPt = calculateIncrementalCost(qc.duplicateOps);
        const transformOpsPt = qc.transformOps * 10;
        const operationsPt = deleteOpsPt + duplicateOpsPt + transformOpsPt;
        
        currentPt = baseCardsPt + inspPt + sparklyPt + operationsPt + deletePenaltiesPt;
        
        breakdown = {
            '初始卡價值': `${qc.initialCount} 張 × 0 PT = 0 PT`,
            '中立卡價值': `${qc.neutralCount} 張 × 20 PT = ${neutralPt} PT`,
            '怪物卡價值': `${qc.monsterCount} 張 × 80 PT = ${monsterPt} PT`,
            '禁忌卡價值': `${qc.forbiddenCount} 張 × 20 PT = ${forbiddenPt} PT`,
            '靈光一閃加成': `普通 ${qc.ordinaryInsp}張 (+10) | 神閃 ${qc.divineInsp}張 (+20) = ${inspPt} PT`,
            '普閃卡加成': `${qc.sparklyCount} 張 × 10 PT = ${sparklyPt} PT`,
            '刪除操作累進費': `${qc.deleteOps} 次操作 = ${deleteOpsPt} PT`,
            '刪除初始/靈光懲罰': `${qc.deletePenalties} 張 × 20 PT = ${deletePenaltiesPt} PT`,
            '複製操作累進費': `${qc.duplicateOps} 次操作 = ${duplicateOpsPt} PT`,
            '卡牌轉換固定費': `${qc.transformOps} 次轉換 × 10 PT = ${transformOpsPt} PT`,
            '總計': `${currentPt} PT`
        };
        
        // Formulate suggestions
        if (qc.monsterCount > 0) {
            suggestions.push({
                type: 'danger',
                text: `牌組中含有 ${qc.monsterCount} 張怪物卡，單張佔用高達 80 PT，極易引發爆倉。如非戰力必要，應儘量避免帶出。`
            });
        }
        if (qc.deletePenalties > 0) {
            suggestions.push({
                type: 'warning',
                text: `您刪除了 ${qc.deletePenalties} 張初始卡或帶靈光卡，被扣除 ${deletePenaltiesPt} PT 額外懲罰。建議透過「轉換為中立卡」來規避此項懲罰。`
            });
        }
        if (qc.deleteOps >= 4) {
            suggestions.push({
                type: 'info',
                text: `刪卡次數達 ${qc.deleteOps} 次，操作費用已攀升至 ${deleteOpsPt} PT。後續刪卡成本將遞增，請謹慎規劃。`
            });
        }
        
        // Update Indicators
        dom.indCardsBase.textContent = `${baseCardsPt + inspPt + sparklyPt} PT`;
        dom.indOperations.textContent = `${operationsPt} PT`;
        dom.indPenalties.textContent = `${deletePenaltiesPt} PT`;
        
    } else {
        // Interactive Simulator Calculations
        let baseCardsPt = 0;
        let inspPt = 0;
        let sparklyPt = 0;
        let monsterCount = 0;
        
        state.deck.forEach(card => {
            if (card.type === 'neutral') baseCardsPt += 20;
            else if (card.type === 'monster') {
                baseCardsPt += 80;
                monsterCount++;
            }
            else if (card.type === 'forbidden') baseCardsPt += 20;
            else if (card.type === 'initial') baseCardsPt += 0;
            
            if (card.sparkly) sparklyPt += 10;
            
            if (card.inspiration === 'ordinary') inspPt += 10;
            else if (card.inspiration === 'divine') inspPt += 20;
        });
        
        const deleteOpsPt = calculateIncrementalCost(state.ops.delete);
        const duplicateOpsPt = calculateIncrementalCost(state.ops.duplicate);
        const transformOpsPt = state.ops.transform * 10;
        const operationsPt = deleteOpsPt + duplicateOpsPt + transformOpsPt;
        
        const deletePenaltiesPt = state.deletedPenaltiesCount * 20;
        
        currentPt = baseCardsPt + inspPt + sparklyPt + operationsPt + deletePenaltiesPt;
        
        breakdown = {
            '目前卡組基礎值': `${baseCardsPt} PT`,
            '靈光一閃加成': `${inspPt} PT`,
            '卡牌普閃加成': `${sparklyPt} PT`,
            '刪除操作累進費': `${state.ops.delete} 次操作 = ${deleteOpsPt} PT`,
            '刪除初始/靈光懲罰': `${state.deletedPenaltiesCount} 次違規 = ${deletePenaltiesPt} PT`,
            '複製操作累進費': `${state.ops.duplicate} 次操作 = ${duplicateOpsPt} PT`,
            '卡牌轉換固定費': `${state.ops.transform} 次轉換 = ${transformOpsPt} PT`,
            '總計': `${currentPt} PT`
        };
        
        // Counter displays syncing
        dom.valDeleteCount.textContent = state.ops.delete;
        dom.valDuplicateCount.textContent = state.ops.duplicate;
        dom.valTransformCount.textContent = state.ops.transform;
        
        // Formulate suggestions
        if (monsterCount > 0) {
            suggestions.push({
                type: 'danger',
                text: `目前牌組中存有 ${monsterCount} 張怪物卡，單卡佔用高達 80 PT！若總分超限，請點擊卡片垃圾桶刪除它，或轉化以減少佔用。`
            });
        }
        if (state.deletedPenaltiesCount > 0) {
            suggestions.push({
                type: 'warning',
                text: `偵測到您刪除了 ${state.deletedPenaltiesCount} 張初始卡或靈光卡，產生了 ${deletePenaltiesPt} PT 額外懲罰。建議透過「轉換中立卡」來避免刪除初始卡的懲罰。`
            });
        }
        if (state.ops.delete >= 4) {
            suggestions.push({
                type: 'info',
                text: `刪卡操作達 ${state.ops.delete} 次，累計消耗 ${deleteOpsPt} PT。建議利用卡牌身上的「移除天賦」免除此累進費用。`
            });
        }
        
        // Update Indicators
        dom.indCardsBase.textContent = `${baseCardsPt + inspPt + sparklyPt} PT`;
        dom.indOperations.textContent = `${operationsPt} PT`;
        dom.indPenalties.textContent = `${deletePenaltiesPt} PT`;
    }
    
    // UI update
    dom.displayCurrentPt.textContent = currentPt;
    dom.displayLimitPt.textContent = limitPt;
    
    // Update progress bar
    let percentage = Math.min((currentPt / limitPt) * 100, 100);
    dom.ptProgressBar.style.width = `${percentage}%`;
    
    if (currentPt > limitPt) {
        dom.ptProgressBar.classList.add('danger');
        dom.ptStatusBadge.textContent = '爆倉預警 (Overlimit)';
        dom.ptStatusBadge.classList.add('danger');
        
        suggestions.unshift({
            type: 'danger',
            text: `⚠️ 存檔價值已超限 (${currentPt} > ${limitPt} PT)！通關結算時系統將強制進行「隨機吃卡或回溯」。建議調整下方卡牌！`
        });
    } else {
        dom.ptProgressBar.classList.remove('danger');
        dom.ptStatusBadge.textContent = '正常 (Safe)';
        dom.ptStatusBadge.classList.remove('danger');
        
        if (suggestions.length === 0) {
            suggestions.push({
                type: 'info',
                text: '當前牌組狀態完美。此存檔價值未超出關卡限制，結算時將順利帶出所有成果！'
            });
        }
    }
    
    // Render suggestions
    dom.analysisSuggestions.innerHTML = '';
    suggestions.forEach(s => {
        const div = document.createElement('div');
        div.className = `suggestion-item ${s.type}`;
        
        let iconSvg = '';
        if (s.type === 'danger') {
            iconSvg = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z"/></svg>`;
        } else if (s.type === 'warning') {
            iconSvg = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
        }
        
        div.innerHTML = `${iconSvg}<div>${s.text}</div>`;
        dom.analysisSuggestions.appendChild(div);
    });
    
    // Render breakdown list
    dom.ptBreakdownList.innerHTML = '';
    for (const [key, value] of Object.entries(breakdown)) {
        const li = document.createElement('li');
        li.innerHTML = `<span>${key}</span><span>${value}</span>`;
        dom.ptBreakdownList.appendChild(li);
    }
}

// Render deck grid
function renderDeck() {
    dom.deckGrid.innerHTML = '';
    dom.deckSize.textContent = state.deck.length;
    
    state.deck.forEach((card, index) => {
        const cardEl = document.createElement('div');
        let cardClass = `card-item ${card.type}`;
        
        if (card.inspiration === 'ordinary') cardClass += ' insp-ordinary';
        else if (card.inspiration === 'divine') cardClass += ' insp-divine';
        
        cardEl.className = cardClass;
        cardEl.dataset.index = index;
        
        // Title translation helper
        let typeName = '初始卡';
        let basePt = 0;
        if (card.type === 'neutral') { typeName = '中立卡'; basePt = 20; }
        else if (card.type === 'monster') { typeName = '怪物卡'; basePt = 80; }
        else if (card.type === 'forbidden') { typeName = '禁忌卡'; basePt = 20; }
        
        let inspText = '';
        if (card.inspiration === 'ordinary') inspText = '+10';
        else if (card.inspiration === 'divine') inspText = '+20';
        
        cardEl.innerHTML = `
            <div class="card-badge-container">
                ${card.inspiration === 'ordinary' ? '<span class="card-badge badge-ordinary">普通靈光</span>' : ''}
                ${card.inspiration === 'divine' ? '<span class="card-badge badge-divine">神之靈光</span>' : ''}
                ${card.sparkly ? '<span class="card-badge badge-sparkly">普閃</span>' : ''}
                ${card.removeTalent ? '<span class="card-badge" style="background-color:rgba(57,255,20,0.15); border:1px solid var(--neon-green); color:var(--neon-green)">移除</span>' : ''}
            </div>
            
            <input type="text" class="card-name-input" value="${card.name}" data-index="${index}">
            
            <div class="card-metadata">
                <div>種類：${typeName} (${basePt} PT)</div>
                ${card.inspiration !== 'none' ? `<div>靈光：${card.inspiration === 'divine' ? '神級' : '普通'} (${inspText} PT)</div>` : ''}
                ${card.sparkly ? '<div>外觀：普閃 (+10 PT)</div>' : ''}
                <div class="card-pt-cost">卡牌總分：<span>${basePt + (card.sparkly ? 10 : 0) + (card.inspiration === 'divine' ? 20 : card.inspiration === 'ordinary' ? 10 : 0)}</span> PT</div>
            </div>
            
            <div class="card-item-actions">
                <!-- Duplicate -->
                <button class="btn-card-action btn-card-duplicate" title="複製此卡牌" data-index="${index}">
                    <svg class="card-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
                
                <!-- Transform (only for initial cards) -->
                ${card.type === 'initial' ? `
                <button class="btn-card-action btn-card-transform" title="轉換為中立卡 (+10 PT)" data-index="${index}">
                    <svg class="card-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M19 12h-2v3h-3v2h5v-5zM7 6h5v2H9v3H7V6zm12-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12z"/></svg>
                </button>` : ''}
                
                <!-- Toggle Remove Talent -->
                <button class="btn-card-action btn-card-talent" title="切換「移除天賦」" data-index="${index}" style="color:${card.removeTalent ? 'var(--neon-green)' : 'var(--text-muted)'}">
                    <svg class="card-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 1 22 12A10 10 0 0 1 12 22A10 10 0 0 1 2 12A10 10 0 0 1 12 2M12 4A8 8 0 0 0 4 12A8 8 0 0 0 12 20A8 8 0 0 0 20 12A8 8 0 0 0 12 4M12 6A6 6 0 0 1 18 12A6 6 0 0 1 12 18A6 6 0 0 1 6 12A6 6 0 0 1 12 6M12 8A4 4 0 0 0 8 12A4 4 0 0 0 12 16A4 4 0 0 0 16 12A4 4 0 0 0 12 8Z"/></svg>
                </button>

                <!-- Delete -->
                <button class="btn-card-action btn-card-delete" title="刪除此卡牌" data-index="${index}">
                    <svg class="card-action-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        `;
        dom.deckGrid.appendChild(cardEl);
    });
    
    // Bind Card Event Listeners
    document.querySelectorAll('.card-name-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.deck[index].name = e.target.value;
        });
    });
    
    document.querySelectorAll('.btn-card-duplicate').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            const cardToCopy = state.deck[idx];
            cardIdCounter++;
            
            // Create exact copy
            const copy = {
                id: cardIdCounter,
                name: `${cardToCopy.name} (複製)`,
                type: cardToCopy.type,
                inspiration: cardToCopy.inspiration,
                sparkly: cardToCopy.sparkly,
                removeTalent: cardToCopy.removeTalent
            };
            
            state.deck.splice(idx + 1, 0, copy);
            state.ops.duplicate++;
            
            renderDeck();
            updatePT();
        });
    });
    
    document.querySelectorAll('.btn-card-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            const cardToDelete = state.deck[idx];
            
            // If the card has removeTalent, deletion does NOT increase delete count and no penalty
            if (cardToDelete.removeTalent) {
                // Free delete
            } else {
                state.ops.delete++;
                
                // Penalty check: deleting initial or inspiration cards triggers a penalty
                if (cardToDelete.type === 'initial' || cardToDelete.inspiration !== 'none') {
                    state.deletedPenaltiesCount++;
                }
            }
            
            state.deck.splice(idx, 1);
            
            renderDeck();
            updatePT();
        });
    });
    
    document.querySelectorAll('.btn-card-transform').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            const card = state.deck[idx];
            
            if (card.type === 'initial') {
                card.type = 'neutral';
                card.name = card.name.replace('初始基本卡', '中立卡');
                state.ops.transform++;
                
                renderDeck();
                updatePT();
            }
        });
    });

    document.querySelectorAll('.btn-card-talent').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            state.deck[idx].removeTalent = !state.deck[idx].removeTalent;
            
            renderDeck();
            updatePT();
        });
    });
}

// Preset Loader
function loadPreset(name) {
    if (name === 'minimalist') {
        state.tier = 15;
        state.nightmare = true;
        state.ops = { delete: 8, duplicate: 1, transform: 0 };
        state.deletedPenaltiesCount = 8; // Deleting 8 starter cards
        state.deck = [
            { id: 101, name: '初始基本卡 #1', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 102, name: '初始基本卡 #2', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 103, name: '核心中立卡 A', type: 'neutral', inspiration: 'ordinary', sparkly: false, removeTalent: false },
            { id: 104, name: '核心中立卡 B', type: 'neutral', inspiration: 'ordinary', sparkly: false, removeTalent: false },
            { id: 105, name: '輸出中立卡 C', type: 'neutral', inspiration: 'divine', sparkly: true, removeTalent: false },
            { id: 106, name: '神閃核心卡 D', type: 'neutral', inspiration: 'divine', sparkly: true, removeTalent: false }
        ];
    } else if (name === 'monster') {
        state.tier = 12;
        state.nightmare = false;
        state.ops = { delete: 2, duplicate: 0, transform: 2 };
        state.deletedPenaltiesCount = 2; // deleted 2 initials
        state.deck = [
            { id: 201, name: '初始基本卡 #3', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 202, name: '初始基本卡 #4', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 203, name: '初始基本卡 #5', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 204, name: '初始基本卡 #6', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 205, name: '初始基本卡 #7', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 206, name: '初始基本卡 #8', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 207, name: '轉化中立卡 #1', type: 'neutral', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 208, name: '轉化中立卡 #2', type: 'neutral', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 209, name: '中立防禦卡', type: 'neutral', inspiration: 'ordinary', sparkly: false, removeTalent: false },
            { id: 210, name: '中立輔助卡', type: 'neutral', inspiration: 'none', sparkly: true, removeTalent: false },
            { id: 211, name: '毀滅之眼 (BOSS)', type: 'monster', inspiration: 'none', sparkly: false, removeTalent: false }
        ];
    } else if (name === 'divine') {
        state.tier = 15;
        state.nightmare = true;
        state.ops = { delete: 4, duplicate: 4, transform: 0 };
        state.deletedPenaltiesCount = 4; // deleted 4 initials
        state.deck = [
            { id: 301, name: '初始基本卡 #1', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 302, name: '初始基本卡 #2', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 303, name: '初始基本卡 #3', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 304, name: '初始基本卡 #4', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 305, name: '初始基本卡 #5', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 306, name: '初始基本卡 #6', type: 'initial', inspiration: 'none', sparkly: false, removeTalent: false },
            { id: 307, name: '神之光芒', type: 'neutral', inspiration: 'divine', sparkly: true, removeTalent: false },
            { id: 308, name: '神之光芒 (複製)', type: 'neutral', inspiration: 'divine', sparkly: true, removeTalent: false },
            { id: 309, name: '天啟', type: 'neutral', inspiration: 'divine', sparkly: false, removeTalent: false },
            { id: 310, name: '天啟 (複製)', type: 'neutral', inspiration: 'divine', sparkly: false, removeTalent: false },
            { id: 311, name: '智慧之光', type: 'neutral', inspiration: 'ordinary', sparkly: false, removeTalent: false },
            { id: 312, name: '星辰召喚', type: 'neutral', inspiration: 'ordinary', sparkly: true, removeTalent: false }
        ];
    }
    
    // Sync settings from presets
    dom.tierSelect.value = state.tier;
    dom.nightmareToggle.checked = state.nightmare;
    
    renderDeck();
    updatePT();
}

// Bind Global Interactions
function bindEvents() {
    // Stage settings
    dom.tierSelect.addEventListener('change', (e) => {
        state.tier = parseInt(e.target.value);
        updatePT();
    });
    
    dom.nightmareToggle.addEventListener('change', (e) => {
        state.nightmare = e.target.checked;
        updatePT();
    });
    
    // Tab switching
    dom.tabHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            dom.tabHeaders.forEach(h => h.classList.remove('active'));
            dom.tabContents.forEach(c => c.classList.remove('active'));
            
            header.classList.add('active');
            const tabId = header.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            
            state.activeTab = tabId;
            updatePT();
        });
    });
    
    // Add custom card
    dom.btnAddCard.addEventListener('click', () => {
        const type = dom.addCardType.value;
        const inspiration = dom.addCardInspiration.value;
        const sparkly = dom.addCardSparkly.checked;
        
        let namePrefix = '中立卡';
        if (type === 'monster') namePrefix = '怪物卡';
        else if (type === 'forbidden') namePrefix = '禁忌卡';
        else if (type === 'initial') namePrefix = '初始卡';
        
        cardIdCounter++;
        state.deck.push({
            id: cardIdCounter,
            name: `${namePrefix} #${state.deck.length + 1}`,
            type: type,
            inspiration: inspiration,
            sparkly: sparkly,
            removeTalent: false
        });
        
        renderDeck();
        updatePT();
        
        // Reset sparkly checkbox
        dom.addCardSparkly.checked = false;
    });
    
    // Operation manual controls
    dom.btnDeleteMinus.addEventListener('click', () => {
        if (state.ops.delete > 0) {
            state.ops.delete--;
            updatePT();
        }
    });
    dom.btnDeletePlus.addEventListener('click', () => {
        state.ops.delete++;
        updatePT();
    });
    
    dom.btnDuplicateMinus.addEventListener('click', () => {
        if (state.ops.duplicate > 0) {
            state.ops.duplicate--;
            updatePT();
        }
    });
    dom.btnDuplicatePlus.addEventListener('click', () => {
        state.ops.duplicate++;
        updatePT();
    });
    
    dom.btnTransformMinus.addEventListener('click', () => {
        if (state.ops.transform > 0) {
            state.ops.transform--;
            updatePT();
        }
    });
    dom.btnTransformPlus.addEventListener('click', () => {
        state.ops.transform++;
        updatePT();
    });
    
    // Deck Controls
    dom.btnResetDeck.addEventListener('click', () => {
        if (confirm('確定要重設為 10 張初始基本卡組嗎？所有當前修改將會遺失。')) {
            generateDefaultDeck();
            renderDeck();
            updatePT();
        }
    });
    
    dom.btnClearAll.addEventListener('click', () => {
        if (confirm('確定要清空所有卡牌嗎？')) {
            state.deck = [];
            state.ops = { delete: 0, duplicate: 0, transform: 0 };
            state.deletedPenaltiesCount = 0;
            renderDeck();
            updatePT();
        }
    });
    
    // JSON Modal actions
    dom.btnModalClose.addEventListener('click', () => {
        dom.jsonModal.classList.remove('active');
    });
    
    dom.btnExportJson.addEventListener('click', () => {
        const payload = {
            tier: state.tier,
            nightmare: state.nightmare,
            ops: state.ops,
            deletedPenaltiesCount: state.deletedPenaltiesCount,
            deck: state.deck
        };
        dom.modalTitle.textContent = '匯出存盤模擬 JSON';
        dom.modalTextarea.value = JSON.stringify(payload, null, 2);
        dom.modalTextarea.readOnly = true;
        dom.btnModalAction.textContent = '複製至剪貼簿';
        dom.jsonModal.classList.add('active');
    });
    
    dom.btnImportJson.addEventListener('click', () => {
        dom.modalTitle.textContent = '匯入存盤模擬 JSON';
        dom.modalTextarea.value = '';
        dom.modalTextarea.readOnly = false;
        dom.btnModalAction.textContent = '確定匯入';
        dom.jsonModal.classList.add('active');
    });
    
    dom.btnModalAction.addEventListener('click', () => {
        if (dom.modalTextarea.readOnly) {
            // Export Copy Action
            dom.modalTextarea.select();
            document.execCommand('copy');
            alert('JSON 資料已成功複製到剪貼簿！');
            dom.jsonModal.classList.remove('active');
        } else {
            // Import Action
            try {
                const parsed = JSON.parse(dom.modalTextarea.value);
                if (parsed && Array.isArray(parsed.deck)) {
                    state.tier = parsed.tier || 15;
                    state.nightmare = !!parsed.nightmare;
                    state.ops = parsed.ops || { delete: 0, duplicate: 0, transform: 0 };
                    state.deletedPenaltiesCount = parsed.deletedPenaltiesCount || 0;
                    state.deck = parsed.deck;
                    
                    dom.tierSelect.value = state.tier;
                    dom.nightmareToggle.checked = state.nightmare;
                    
                    renderDeck();
                    updatePT();
                    dom.jsonModal.classList.remove('active');
                    alert('存盤資料匯入成功！');
                } else {
                    alert('格式錯誤：JSON 資料必須包含有效的卡牌陣列！');
                }
            } catch (err) {
                alert('解析 JSON 失敗，請確認內容格式是否正確！');
            }
        }
    });
    
    // Preset load buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const presetName = e.target.dataset.preset;
            loadPreset(presetName);
        });
    });
    
    // Quick Calc Input Event Listeners
    const quickCalcInputs = [
        'calc-initial-count', 'calc-neutral-count', 'calc-monster-count', 'calc-forbidden-count',
        'calc-ordinary-insp', 'calc-divine-insp', 'calc-sparkly-count',
        'calc-delete-ops', 'calc-delete-penalties', 'calc-duplicate-ops', 'calc-transform-ops'
    ];
    
    quickCalcInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            const prop = id.replace('calc-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            state.quickCalc[prop] = parseInt(e.target.value) || 0;
            updatePT();
        });
    });
}

// App Bootstrap
function init() {
    initTiers();
    generateDefaultDeck();
    bindEvents();
    renderDeck();
    updatePT();
}

// Run app
window.addEventListener('DOMContentLoaded', init);
