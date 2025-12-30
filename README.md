## 👗 CodiIt

**2025.09.15 ~ 2025.11.03** </br>
패션 상품을 거래할 수 있는 패션 이커머스 플랫폼 서비스 백엔드 </br>

📄 [프로젝트 계획서](https://www.notion.so/jinsoldev/2-26f985c9419581aea95bfa87b7151a01?source=copy_link)

<p>
  <img src=""/>
</p>

## 1. 서비스 링크

- **[코디잇](https://nb-02-codi-it-fe.vercel.app/login)**

## 2. 프로젝트 아키텍처
<img alt="image" src="public/architecture.png" />

## 3. 기술 스택

| 구분           | 기술                          |
| -------------- | ----------------------------- |
| Backend        | NestJS, TypeScript            |
| ORM            | Prisma                        |
| Database       | PostgreSQL, AWS RDS/S3        |
| API 문서화     | Swagger                       |
| 테스트         | Jest,SuperTest, ESLint.       |
| 협업 도구      | Git & GitHub, Discord, Notion |
| Infra / Deploy | AWS EC2, Docker, Nginx        |
| CI/CD          | GitHub Actions                |

## 4. 팀 구성

| 이름        | 역할                          |
| ----------- | --------------------------- |
| 차수연      | Cart / S3 / Dashboard         |
| 권나현      | Auth / User / Point & Grade   |
| **김진솔** | **Store / Notification / CI&CD / Deploy** |
| 조가현      | Review / Inquiry                |
| 진성남      | Product / Order                  |

## 5. 담당 기능
### Store (스토어 API)
- 판매자의 스토어 생성, 수정, 상품 등록, 상세 조회
- 구매자의 스토어 상세 조회, 관심 스토어 등록 및 해제

### Notification (알림 API)
- SSE를 활용한 실시간 알림 기능 구현
- 유저 타입에 따른 알림 제공 
  - 구매자: 장바구니 또는 주문하기에 담긴 상품 품절, 문의글에 대한 답변이 달렸을 경우
  - 판매자: 판매중인 상품 품절, 상품에 대한 새로운 문의 글이 작성되었을 경우
- 알림 읽음 처리

### CI&CD / Deploy (배포 및 인프라 관리)
- GitHub Actions를 활용한 CI/CD 파이프라인 구축
- Docker와 Nginx를 활용한 AWS EC2 배포 자동화

## 6. 프로젝트 구조
```
src
 ┣ auth            # 인증/인가 (JWT, Guard, Decorator, Cookie)
 ┣ users           # 사용자 도메인
 ┣ store           # 상점 도메인
 ┣ products        # 상품 도메인
 ┣ cart            # 장바구니 도메인
 ┣ orders          # 주문 도메인
 ┣ review          # 리뷰 도메인
 ┣ inquiry         # 문의 도메인
 ┣ points          # 포인트 도메인
 ┣ notifications   # 알림 도메인 (SSE/실시간)
 ┣ dashboard       # 관리자 대시보드
 ┣ grades          # 등급/정책 로직
 ┣ s3              # 파일 업로드 (S3)
 ┣ health          # 헬스체크

 ┣ common          # 공통 모듈
 ┃ ┣ guard         # 역할 기반 Guard (buyer/seller)
 ┃ ┣ middleware    # 로깅 미들웨어
 ┃ ┣ pipes         # 커스텀 Pipe
 ┃ ┣ logger        # Winston, Sentry 설정
 ┃ ┗ prisma-tx     # Prisma 트랜잭션 타입

 ┣ prisma          # Prisma Service / Module
 ┣ types           # 전역 타입 정의

 ┣ app.module.ts
 ┣ app.controller.ts
 ┣ app.service.ts
 ┗ main.ts
```

## 7. 회고
API와 실시간 알림 구현, 그리고 자동 배포까지 평소 꼭 한 번은 직접 경험해 보고 싶었던 기능들을 모두 구현해 볼 수 있었던 프로젝트였다. 
단순히 기능을 만드는 데 그치지 않고, 실제 서비스 운영을 고려한 백엔드 전반의 흐름을 끝까지 경험했다는 점에서 개인적으로 의미가 컸다. </br>

처음 접하는 NestJS 프레임워크를 사용한다는 점에서 걱정과 설렘이 공존했지만, 공식 문서와 다양한 레퍼런스를 꾸준히 참고하여 빠르게 적응할 수 있었다.
특히 SSE(Server-Sent Events)를 활용한 실시간 알림 기능을 구현하면서 비동기 프로그래밍과 이벤트 기반 아키텍처에 대한 이해도가 한층 높아졌고, 
사용자 경험을 직접적으로 개선할 수 있다는 점에서 큰 성취감을 느꼈다. </br>

또한, GitHub Actions를 활용한 CI/CD 파이프라인 구축, Docker와 Nginx를 이용한 AWS EC2 배포 자동화를 통해 개발부터 배포까지의
과정을 효율적으로 관리할 수 있었다. 이 과정에서 DevOps 관점에서의 흐름을 직접 경험하며, 단순한 기능 개발을 넘어 실제 서비스 운영에 필요한 
기술과 고민들을 체감할 수 있었다. </br>

이번 프로젝트를 통해 백엔드 개발자로서의 기술적 깊이와 시야를 동시에 확장할 수 있었고, 설계의 이유를 설명할 수 있고 운영을 고려하는 백엔드 개발자로
한 단계 성장할 수 있었다고 느낀다.  앞으로도 새로운 기술을 두려워하지 않고 적극적으로 탐구하며, 실제 문제를 해결하는 방향으로 계속 도전해 나가고 싶다. 