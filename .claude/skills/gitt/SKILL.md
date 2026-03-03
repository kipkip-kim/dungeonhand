---
name: gitt
description: Git 커밋과 푸시를 한번에 실행. 커밋 메시지를 인자로 받거나, 없으면 변경 내용을 자동 요약해서 커밋.
disable-model-invocation: true
---

# gitt — Git 커밋 + 푸시 자동화

## 실행 순서

1. `git add .` 실행
2. 커밋 메시지 결정:
   - `$ARGUMENTS`가 있으면 → 그대로 커밋 메시지로 사용
   - `$ARGUMENTS`가 비어있으면 → `git diff --cached --stat`을 읽고, 변경 내용을 한국어 한 줄로 요약해서 커밋 메시지 생성
3. `git commit -m "메시지"` 실행
4. `git push` 실행
5. 완료 후 커밋 해시와 메시지를 출력

## 커밋 메시지 자동 생성 규칙

- 한국어로 작성
- 50자 이내
- "무엇을 했는지"를 명확하게
- 예: "유물 5종 추가 (경제/생존 카테고리)"
- 예: "난이도 선택 UI 구현"

## 사용 예시

```
/gitt 세션4 구현 완료
→ git commit -m "세션4 구현 완료" && git push

/gitt
→ (변경 내용 분석 후) git commit -m "몬스터 HP 조정 및 기습 시스템 구현" && git push
```
