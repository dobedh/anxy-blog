#!/usr/bin/env node

/**
 * 환경 변수 테스트 스크립트
 * 실행: node test-env.js
 */

console.log('========================================');
console.log('🔍 환경 변수 검증 시작');
console.log('========================================\n');

// 필요한 환경 변수 목록
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let allVarsPresent = true;

// 각 환경 변수 확인
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];

  if (value) {
    console.log(`✅ ${varName}`);
    console.log(`   값: ${value.substring(0, 50)}...`);
    console.log(`   길이: ${value.length} 문자`);
  } else {
    console.log(`❌ ${varName} - 누락됨`);
    allVarsPresent = false;
  }
  console.log('');
});

// .env.local 파일 존재 확인
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');

console.log('========================================');
console.log('📁 .env.local 파일 확인');
console.log('========================================\n');

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local 파일이 존재합니다.');

  // 파일 내용 확인 (API 키는 일부만 표시)
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  console.log('\n📝 파일 내용:');
  lines.forEach((line) => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        const displayValue = value.length > 50
          ? value.substring(0, 30) + '...' + value.substring(value.length - 10)
          : value;
        console.log(`   ${key}=${displayValue}`);
      }
    }
  });
} else {
  console.log('❌ .env.local 파일이 없습니다!');
  console.log('   → .env.local 파일을 생성하고 환경 변수를 설정해주세요.');
}

// 결과 요약
console.log('\n========================================');
console.log('📊 검증 결과');
console.log('========================================\n');

if (allVarsPresent) {
  console.log('✅ 모든 환경 변수가 정상적으로 설정되어 있습니다.');
  console.log('   개발 서버를 재시작해보세요: npm run dev');
} else {
  console.log('❌ 누락된 환경 변수가 있습니다.');
  console.log('\n💡 해결 방법:');
  console.log('   1. .env.local 파일에 누락된 환경 변수 추가');
  console.log('   2. 개발 서버 재시작: npm run dev');
  console.log('   3. 브라우저 캐시 삭제 및 새로고침');
}

console.log('\n========================================');
console.log('✨ 테스트 완료');
console.log('========================================');