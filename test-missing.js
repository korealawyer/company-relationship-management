const checkMissing = (val) => {
    if (!val || typeof val !== 'string') return false;
    const normalized = val.trim().replace(/\s+/g, '');
    if (normalized === '없음' || normalized === '미기재' || normalized === '방침없음' || normalized === '해당없음') return true;
    if (val.includes('해당 기업은 개인정보 처리방침이 없거나 확인되지 않습니다')) return true;
    return false;
};

console.log(checkMissing("없음")); // true
console.log(checkMissing(" 없음 ")); // true
console.log(checkMissing("해당 기업은 개인정보 처리방침이 없거나 확인되지 않습니다 어쩌구")); // true
