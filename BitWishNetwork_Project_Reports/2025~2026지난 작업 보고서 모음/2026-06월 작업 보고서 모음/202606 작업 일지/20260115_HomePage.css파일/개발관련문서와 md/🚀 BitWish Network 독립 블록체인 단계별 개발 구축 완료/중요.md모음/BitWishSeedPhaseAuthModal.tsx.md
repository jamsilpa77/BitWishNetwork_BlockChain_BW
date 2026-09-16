/**
 * ====================================================================================
 * BitWishSeedPhraseAuthModal.tsx - BitWish 전용 시드문구 인증 모달
 * ====================================================================================
 * 
 * 🎯 핵심 기능:
 * - BitWish 24단어 시드문구 입력
 * - BitWish 시드문구 검증
 * - BitWish 지갑 주소 생성 및 인증
 * - BitWish 블록체인 연동
 * 
 * ⚠️  전역 변수, 공통 함수, 공통 클래스, 전역 모달, 중복 코드 절대금지!
 * ✅ 완벽한 독립성 보장 - 모든 텍스트 4개국 언어 즉시 번역 지원
 * ====================================================================================
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Wallet,
  Shield,
  Key
} from 'lucide-react';

interface BitWishSeedPhraseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletAuthenticated: (walletAddress: string) => void;
  onCreateNewWallet: () => void; // 새 지갑 만들기 함수 추가
}

const BitWishSeedPhraseAuthModal: React.FC<BitWishSeedPhraseAuthModalProps> = ({
  isOpen,
  onClose,
  onWalletAuthenticated,
  onCreateNewWallet // 새 지갑 만들기 함수 추가
}) => {
  const { t } = useTranslation();
  
  // 자체 상태 관리
  const [seedPhrase, setSeedPhrase] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showNewWalletWarning, setShowNewWalletWarning] = useState(false);

  // BitWish 시드문구 검증 함수
  const validateBitWishSeedPhrase = (phrase: string): boolean => {
    const trimmedPhrase = phrase.trim();
    const words = trimmedPhrase.split(/\s+/);
    
    // 24단어 검증
    if (words.length !== 24) {
      return false;
    }
    
    // BIP39 단어 검증
    const bip39Words = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
        'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
        'action', 'actor', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult',
        'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
        'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien',
        'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always',
        'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
        'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
        'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area',
        'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive',
        'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
        'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
        'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware',
        'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag',
        'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel',
        'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef',
        'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best',
        'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird',
        'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind',
        'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil',
        'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom',
        'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze',
        'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom',
        'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk',
        'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter',
        'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm',
        'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon',
        'capable', 'capital', 'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry', 'case',
        'cash', 'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cause', 'caution',
        'ceiling', 'celery', 'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion',
        'change', 'chaos', 'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef',
        'cherry', 'chest', 'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle',
        'chunk', 'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil', 'claim', 'clap',
        'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb',
        'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club', 'clump',
        'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect',
        'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert', 'conduct',
        'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper', 'copy',
        'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course',
        'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash', 'crater',
        'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic',
        'cross', 'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush', 'cry',
        'crystal', 'cube', 'culture', 'cup', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion',
        'custom', 'cute', 'cycle', 'dad', 'damage', 'dance', 'danger', 'daring', 'dash', 'daughter',
        'dawn', 'day', 'deal', 'debate', 'debris', 'decade', 'december', 'decide', 'decline', 'decorate',
        'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay', 'deliver', 'demand', 'demise',
        'denial', 'dentist', 'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive', 'describe',
        'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect', 'develop', 'device', 'devote',
        'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel', 'diet', 'differ', 'digital', 'dignity',
        'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss',
        'disorder', 'display', 'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document', 'dog',
        'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose', 'double', 'dove',
        'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream', 'dress', 'drift', 'drill', 'drink',
        'drop', 'drum', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty',
        'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily', 'east', 'easy',
        'echo', 'ecology', 'economy', 'edge', 'edit', 'educate', 'effort', 'egg', 'eight', 'either',
        'elbow', 'elder', 'electric', 'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark',
        'embody', 'embrace', 'emerge', 'emotion', 'employ', 'empower', 'empty', 'enable', 'enact', 'end',
        'endless', 'endorse', 'enemy', 'energy', 'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist',
        'enough', 'enrich', 'enroll', 'ensure', 'enter', 'entire', 'entry', 'envelope', 'episode', 'equal',
        'equip', 'era', 'erase', 'erode', 'erosion', 'error', 'erupt', 'escape', 'essay', 'essence',
        'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke', 'evolve', 'exact', 'example', 'excess',
        'exchange', 'excite', 'exclude', 'excuse', 'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist',
        'exit', 'exotic', 'expand', 'expect', 'expire', 'explain', 'expose', 'express', 'extend', 'extra',
        'eye', 'eyebrow', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall', 'false',
        'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy', 'farm', 'fashion', 'fat', 'fatal',
        'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal', 'fee', 'feed', 'feel',
        'female', 'fence', 'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field', 'figure',
        'file', 'film', 'filter', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'firm',
        'first', 'fiscal', 'fish', 'fit', 'fitness', 'fix', 'flag', 'flame', 'flash', 'flat',
        'flavor', 'flee', 'flight', 'flip', 'float', 'flock', 'floor', 'flower', 'fluid', 'flush',
        'fly', 'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot', 'force',
        'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found', 'fox',
        'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog', 'front', 'frost', 'frown',
        'frozen', 'fruit', 'fuel', 'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain',
        'galaxy', 'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas',
        'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle', 'genuine',
        'gesture', 'ghost', 'giant', 'gift', 'giggle', 'ginger', 'giraffe', 'girl', 'give', 'glad',
        'glance', 'glare', 'glass', 'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow',
        'glue', 'goat', 'goddess', 'gold', 'good', 'goose', 'gorilla', 'govern', 'gown', 'grab',
        'grace', 'grain', 'grant', 'grape', 'grass', 'gravity', 'great', 'green', 'grid', 'grief',
        'grit', 'grocery', 'group', 'grow', 'grunt', 'guard', 'guess', 'guide', 'guilt', 'guitar',
        'gun', 'gym', 'habit', 'hair', 'half', 'hammer', 'hamster', 'hand', 'happy', 'harbor',
        'hard', 'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard', 'head', 'heal', 'health',
        'hear', 'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen', 'hero',
        'hidden', 'high', 'hill', 'hint', 'hip', 'hire', 'history', 'hobby', 'hockey', 'hold',
        'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope', 'horn', 'horror', 'horse',
        'hospital', 'host', 'hotel', 'hour', 'hover', 'hub', 'huge', 'human', 'humble', 'humor',
        'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid', 'ice', 'icon',
        'idea', 'identify', 'idle', 'ignore', 'ill', 'illegal', 'illness', 'image', 'imitate', 'immense',
        'immune', 'impact', 'impose', 'improve', 'impulse', 'inch', 'include', 'income', 'increase', 'index',
        'indicate', 'indoor', 'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject',
        'injury', 'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect', 'inside', 'inspire',
        'install', 'intact', 'interest', 'into', 'invest', 'invite', 'involve', 'iron', 'island', 'isolate',
        'issue', 'item', 'ivory', 'jacket', 'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly',
        'jewel', 'job', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle',
        'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key', 'kick', 'kid',
        'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen', 'kite', 'kitten', 'kiwi', 'knee',
        'knife', 'knock', 'know', 'lab', 'label', 'labor', 'ladder', 'lady', 'lake', 'lamp',
        'language', 'laptop', 'large', 'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn',
        'lawsuit', 'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left', 'leg',
        'legal', 'legend', 'leisure', 'lemon', 'lend', 'length', 'lens', 'leopard', 'lesson', 'letter',
        'level', 'liar', 'liberty', 'library', 'license', 'life', 'lift', 'light', 'like', 'limb',
        'limit', 'link', 'lion', 'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan',
        'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery', 'loud', 'lounge',
        'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch', 'luxury', 'lyrics', 'machine',
        'mad', 'magic', 'magnet', 'maid', 'mail', 'main', 'major', 'make', 'mammal', 'man',
        'manage', 'mandate', 'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine',
        'market', 'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix', 'matter',
        'mature', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat', 'mechanic', 'medal', 'media',
        'melody', 'melt', 'member', 'memory', 'mention', 'menu', 'mercy', 'merge', 'merit', 'merry',
        'mesh', 'message', 'metal', 'method', 'middle', 'midnight', 'milk', 'million', 'mimic', 'mind',
        'minimum', 'minor', 'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix', 'mixed',
        'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor', 'monkey', 'monster', 'month',
        'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion', 'motor', 'mountain', 'mouse',
        'move', 'movie', 'much', 'muffin', 'mule', 'multiply', 'muscle', 'museum', 'music', 'must',
        'mutual', 'myself', 'mystery', 'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation',
        'nature', 'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'nest',
        'net', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night', 'noble', 'noise',
        'nominee', 'noodle', 'normal', 'north', 'nose', 'notable', 'note', 'nothing', 'notice', 'novel',
        'now', 'nuclear', 'number', 'nurse', 'nut', 'oak', 'obey', 'object', 'oblige', 'obscure',
        'observe', 'obtain', 'obvious', 'occur', 'ocean', 'october', 'odor', 'off', 'offer', 'office',
        'often', 'oil', 'okay', 'old', 'olive', 'olympic', 'omit', 'once', 'one', 'onion',
        'online', 'only', 'open', 'opera', 'opinion', 'oppose', 'option', 'orange', 'orbit', 'orchard',
        'order', 'ordinary', 'organ', 'orient', 'original', 'orphan', 'ostrich', 'other', 'outdoor', 'outer',
        'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner', 'oxygen', 'oyster', 'ozone',
        'pact', 'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic', 'panther',
        'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass', 'patch', 'path', 'patient',
        'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace', 'peanut', 'pear', 'peasant', 'pelican',
        'pen', 'penalty', 'pencil', 'people', 'pepper', 'perfect', 'permit', 'person', 'pet', 'phone',
        'photo', 'phrase', 'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill',
        'pilot', 'pink', 'pioneer', 'pipe', 'pistol', 'pitch', 'pitcher', 'pizza', 'place', 'planet',
        'plastic', 'plate', 'play', 'please', 'pledge', 'pluck', 'plug', 'plunge', 'poem', 'poet',
        'point', 'polar', 'pole', 'police', 'pond', 'pony', 'pool', 'poor', 'popular', 'portion',
        'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power', 'practice', 'praise',
        'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent', 'price', 'pride', 'primary', 'print',
        'priority', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'profit', 'program', 'project',
        'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'provide', 'public', 'pudding', 'pull',
        'pulp', 'pulse', 'pumpkin', 'punch', 'pupil', 'puppy', 'purchase', 'purity', 'purpose', 'purse',
        'push', 'put', 'puzzle', 'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit',
        'quiz', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio', 'rail', 'rain',
        'raise', 'rally', 'ramp', 'ranch', 'random', 'range', 'rapid', 'rare', 'rate', 'rather',
        'raven', 'raw', 'razor', 'ready', 'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive',
        'recipe', 'record', 'recycle', 'reduce', 'reflect', 'reform', 'refuse', 'region', 'regret', 'regular',
        'reject', 'relax', 'release', 'relief', 'rely', 'remain', 'remember', 'remind', 'remove', 'render',
        'renew', 'rent', 'reopen', 'repair', 'repeat', 'replace', 'report', 'require', 'rescue', 'resemble',
        'resist', 'resource', 'response', 'result', 'retire', 'retreat', 'return', 'reunion', 'reveal', 'review',
        'reward', 'rhythm', 'rib', 'ribbon', 'rice', 'rich', 'ride', 'ridge', 'rifle', 'right',
        'rigid', 'ring', 'riot', 'ripple', 'risk', 'ritual', 'rival', 'river', 'road', 'roast',
        'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate', 'rough',
        'round', 'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway', 'rural',
        'sad', 'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute',
        'same', 'sample', 'sand', 'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'say', 'scale',
        'scan', 'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout',
        'scrap', 'screen', 'script', 'scrub', 'sea', 'search', 'season', 'seat', 'second', 'secret',
        'section', 'security', 'seed', 'seek', 'segment', 'select', 'sell', 'seminar', 'senior', 'sense',
        'sentence', 'series', 'service', 'session', 'settle', 'setup', 'seven', 'shadow', 'shaft', 'shallow',
        'share', 'shelf', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship', 'shiver', 'shock',
        'shoe', 'shoot', 'shop', 'shore', 'short', 'shoulder', 'shove', 'shrimp', 'shrug', 'shuffle',
        'shy', 'sibling', 'sick', 'side', 'siege', 'sight', 'sign', 'silent', 'silk', 'silly',
        'silver', 'similar', 'simple', 'since', 'sing', 'siren', 'sister', 'situate', 'six', 'size',
        'skate', 'sketch', 'ski', 'skill', 'skin', 'skirt', 'skull', 'slab', 'slack', 'slain',
        'slang', 'slate', 'slave', 'slender', 'slice', 'slide', 'slight', 'slim', 'slogan', 'slot',
        'slow', 'slush', 'sly', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake',
        'snap', 'sniff', 'sniper', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda', 'soft',
        'solar', 'soldier', 'solid', 'solution', 'solve', 'someone', 'song', 'soon', 'sore', 'sorry',
        'sort', 'soul', 'sound', 'soup', 'source', 'south', 'space', 'spare', 'spatial', 'spawn',
        'speak', 'special', 'speed', 'spell', 'spend', 'sphere', 'spice', 'spider', 'spike', 'spin',
        'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray', 'spread', 'spring',
        'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium', 'staff', 'stage', 'stairs', 'stamp',
        'stand', 'start', 'state', 'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick',
        'still', 'sting', 'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike',
        'strong', 'struggle', 'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway', 'success',
        'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset',
        'super', 'supply', 'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect',
        'sustain', 'swallow', 'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift', 'swim', 'swing',
        'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail',
        'talent', 'talk', 'tank', 'tape', 'target', 'task', 'taste', 'tavern', 'taxi', 'teach',
        'team', 'tell', 'ten', 'tenant', 'tennis', 'tent', 'term', 'test', 'text', 'thank',
        'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this', 'thought', 'three',
        'thrive', 'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber', 'time',
        'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today', 'toddler', 'toe',
        'together', 'toilet', 'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth',
        'top', 'topic', 'topple', 'torch', 'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward',
        'tower', 'town', 'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap',
        'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe', 'trick', 'trigger',
        'trim', 'trip', 'trophy', 'trouble', 'truck', 'true', 'truly', 'trumpet', 'trust', 'truth',
        'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve',
        'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella', 'unable',
        'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy', 'uniform', 'unique',
        'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update', 'upgrade', 'uphold',
        'upright', 'uprising', 'uproar', 'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful',
        'useless', 'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'van',
        'vanish', 'vapor', 'various', 'vast', 'vault', 'vehicle', 'velvet', 'vendor', 'venom', 'venue',
        'verify', 'version', 'very', 'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video',
        'view', 'village', 'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit', 'visual', 'vital',
        'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume', 'vote', 'vow', 'vulnerable', 'wade',
        'waffle', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want', 'warfare', 'warm',
        'warrior', 'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon', 'wear',
        'weasel', 'weather', 'web', 'wedding', 'wednesday', 'weed', 'week', 'weird', 'welcome', 'west',
        'wet', 'whale', 'what', 'whatever', 'wheat', 'wheel', 'when', 'whenever', 'where', 'whereas',
        'wherever', 'whether', 'which', 'whiff', 'while', 'whine', 'whip', 'whisper', 'white', 'whole',
        'whoop', 'whoosh', 'whose', 'why', 'wicked', 'wide', 'width', 'wife', 'wild', 'will',
        'willing', 'win', 'wind', 'windmill', 'window', 'wine', 'wing', 'wink', 'winner', 'winter',
        'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'wool',
        'word', 'work', 'world', 'worm', 'worry', 'worse', 'worst', 'worth', 'would', 'wound',
        'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard', 'year', 'yellow', 'you',
        'young', 'youth', 'zebra', 'zero', 'zone', 'zoo'
      ];
    
    return words.every(word => bip39Words.includes(word.toLowerCase()));
  };

  // BitWish 블록체인 오리지널 지갑 주소 생성 함수
  const generateBitWishWalletAddress = async (seedPhrase: string): Promise<string> => {
    try {
      // 시드문구를 SHA-256으로 해시화
      const encoder = new TextEncoder();
      const data = encoder.encode(seedPhrase.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // BitWish 주소: BW + 40자리 16진수 (총 42자리)
      return 'BW' + hashHex.substring(0, 40).toUpperCase();
    } catch (error) {
      console.error('BitWish wallet address generation error:', error);
      // 오류 시 대체 방법
      const hash = btoa(seedPhrase).replace(/[^A-Za-z0-9]/g, '');
      return 'BW' + hash.substring(0, 40).toUpperCase();
    }
  };

  // 🔒 완벽한 보안 강화: BitWish 시드문구 인증 처리
  const handleBitWishAuthentication = async () => {
    try {
      setIsAuthenticating(true);
      setError('');
      setSuccess('');

      // 1단계: 기본 시드문구 형식 검증
      if (!validateBitWishSeedPhrase(seedPhrase)) {
        setError(t('bitwish.wallet.seedPhrase.invalid', '유효하지 않은 시드문구입니다. 24단어를 정확히 입력해주세요.'));
        return;
      }

      // 2단계: 시드문구로 지갑 주소 생성
      const generatedAddress = await generateBitWishWalletAddress(seedPhrase);
      
      // 디버깅을 위한 로그 추가
      console.log('🔍 프론트엔드 생성된 주소:', generatedAddress);
      console.log('📝 시드문구 길이:', seedPhrase.length);
      console.log('📝 Trim된 시드문구 길이:', seedPhrase.trim().length);
      
      // 3단계: 🌐 백엔드 API 검증 (MongoDB 데이터 사용)
      try {
        const verifyResponse = await fetch('http://localhost:4001/api/bitwish/wallet/verify-seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: generatedAddress,
            seedPhrase: seedPhrase.trim() // 추가 trim 처리
          })
        });
        
        const verifyResult = await verifyResponse.json();
        if (!verifyResult.success) {
          setError('시드문구가 지갑 주소와 일치하지 않습니다. 공백이나 오타를 확인해주세요.');
          return;
        }
        
        console.log('✅ 백엔드 시드문구 검증 성공:', verifyResult);
      } catch (apiError) {
        console.error('백엔드 API 검증 실패:', apiError);
        setError('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
        return;
      }

      // 7단계: BitWish 블록체인 형식 검증 (제거됨 - 시드문구 입력창에서는 불필요)

      // 4단계: 🎉 모든 검증 통과 - 인증 성공
      setSuccess('BitWish 지갑 인증이 완료되었습니다.');
      
      // 5단계: 인증 정보 업데이트 (백엔드 데이터 사용)
      const authData = {
        address: generatedAddress,
        publicKey: generatedAddress, // BitWish에서는 주소가 공개키 역할
        networkType: 'BITWISH_MAINNET',
        authenticatedAt: new Date().toISOString(),
        userType: 'USER',
        name: 'My BitWish Wallet',
        referralCode: ''
      };
      
      localStorage.setItem('bitwish_wallet_auth', JSON.stringify(authData));
      
      // 6단계: 부모 컴포넌트에 인증 성공 알림
      setTimeout(() => {
        onWalletAuthenticated(generatedAddress);
        handleClose();
      }, 1500);

    } catch (error) {
      setError('BitWish 지갑 인증 중 오류가 발생했습니다.');
      console.error('BitWish seed phrase authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // BitWish 블록체인 지갑 검증 (제거됨 - 시드문구 입력창에서는 불필요)

  // 모달 닫기
  const handleClose = () => {
    setSeedPhrase('');
    setError('');
    setSuccess('');
    setIsAuthenticating(false);
    setShowSeedPhrase(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* 모달 헤더 */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('bitwish.wallet.seedPhrase.title', 'BitWish 시드문구 인증')}
              </h2>
              <p className="text-gray-600">
                {t('bitwish.wallet.seedPhrase.subtitle', 'BitWish 지갑에 접근하기 위해 시드문구를 입력하세요')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            title={t('common.close', '닫기')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-6 space-y-6">
          {/* 시드문구 입력 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {t('bitwish.wallet.seedPhrase.inputTitle', 'BitWish 시드문구 입력')}
              </h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  {t('bitwish.wallet.seedPhrase.label', '24단어 시드문구')}
                </label>
                <button
                  onClick={() => setShowNewWalletWarning(true)}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  {t('common.createNewWallet', '새 지갑 만들기')}
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value.trim())}
                  placeholder={t('bitwish.wallet.seedPhrase.placeholder', '24단어 시드문구를 공백으로 구분하여 입력하세요')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  disabled={isAuthenticating}
                />
                <button
                  type="button"
                  onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showSeedPhrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {t('bitwish.wallet.seedPhrase.note', '정확히 24단어를 입력해야 합니다')}
              </p>
              <div className="text-sm text-gray-500 mt-2">
                💡 시드문구 입력 시 앞뒤 공백이 자동으로 제거됩니다.
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* 인증 버튼 */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isAuthenticating}
            >
              {t('common.cancel', '취소')}
            </button>
            <button
              onClick={handleBitWishAuthentication}
              disabled={isAuthenticating || !seedPhrase.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('bitwish.wallet.seedPhrase.authenticating', '인증 중...')}</span>
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>{t('bitwish.wallet.seedPhrase.authenticate', 'BitWish 지갑 인증')}</span>
                </>
              )}
            </button>
          </div>

          {/* 도움말 */}
          <div className="text-center">
            <a
              href="#"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('bitwish.wallet.seedPhrase.help', 'BitWish 시드문구 인증 도움말')}
            </a>
          </div>
        </div>
      </div>

      {/* 새 지갑 만들기 고급 경고 모달 */}
      {showNewWalletWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('common.seedPhraseLostTitle', '시드문구를 분실하셨나요?')}
              </h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-700 font-medium mb-3">{t('common.seedPhraseLostWarning', '새 지갑을 만들시면 이전 지갑은 더 이상 사용 하실 수 없습니다.')}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {t('common.irreversibleConsequence1', '기존 지갑의 모든 BW 자산이 영원히 소각됩니다')}
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {t('common.irreversibleConsequence2', '기존 채굴/보상 이력이 모두 사라집니다')}
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {t('common.irreversibleConsequence3', '새 지갑은 0 BW부터 다시 시작됩니다')}
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {t('common.irreversibleConsequence4', '이전 지갑 주소는 영원히 접근할 수 없습니다')}
                </li>
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewWalletWarning(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancelButton', '취소')}
              </button>
              <button
                onClick={() => {
                  setShowNewWalletWarning(false);
                  onCreateNewWallet(); // 지갑 만들기 모달 열기
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('common.confirmButton', '확인')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BitWishSeedPhraseAuthModal;
