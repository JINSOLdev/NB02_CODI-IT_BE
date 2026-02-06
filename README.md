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

## 4. 프로젝트 구조
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

## 5. 담당 기능
### Store (스토어 API)
- 판매자의 스토어 생성, 수정, 상품 등록, 상세 조회
- 구매자의 스토어 상세 조회, 관심 스토어 등록 및 해제

### Notification (알림 API)
<p>
  <img src=""/>
</p>

- 재고/주문 이벤트 기반 설계
- SSE(Server-Sent Events)를 활용한 실시간 알림 전송
- 비즈니스 이벤트 기반 알림 구조로 설계
- 알림 발생 시점을 데이터 상태 변화 기준으로 분리
- 알림 읽음 처리

- 알림 발생 시점 설계
  | 이벤트             | 대상  | 알림 타입               | 설명                            |
  | -----------------|------|-----------------------|--------------------------------|
  | 상품 문의 등록      | 판매자 | `NEW_INQUIRY`         | 상품에 새로운 문의가 작성되었을 때      |
  | 주문 시 재고 부족    | 구매자 | `OUT_OF_STOCK_CART`  | 주문 시점에 재고가 부족한 경우         |
  | 품절 상품 주문 시도  | 판매자 | `OUT_OF_STOCK_ORDER`  | 품절된 상품에 대해 주문이 시도된 경우   |
  | 재고 차감 후 품절   | 판매자 | `OUT_OF_STOCK_SELLER` | 주문 이후 특정 사이즈 재고가 0이 된 경우 |

- 주문 생성 트랜잭션 내부에서 재고 차감과 알림을 함께 처리
  - 재고 차감 실패 시 알림 생성 후 트랜잭션 롤백
  - 데이터 정합성과 사용자 알림을 동시에 보장
- 재고 (Stock)는 (productId, sizeId) 단위로 관리하여
  - 주문 아이템(OrderItem)에 sizeId를 저장
  - 구매한 사이즈 기준으로 정확한 알림 및 응답 제공
- 재고 차감 결과(updateMany.count)를 기준으로 동시 주문 상황에서도 초과 판매 방지
- 재고 상태와 알림이 분리되지 않고 하나의 흐름으로 동작할 수 있음
- 구매자는 왜 주문이 안되는지 즉시 인지 가능
- 판매자는 품절 및 주문 시도를 실시간으로 확인 가능함
- 알림이 단순 메시지가 아닌 비즈니스 상태 변화의 결과로 동작할 수 있게 됨


### CI&CD / Deploy (배포 및 인프라 관리)
- GitHub Actions를 활용한 CI/CD 파이프라인 구축
- Docker와 Nginx를 활용한 AWS EC2 배포 자동화


## 6. 회고
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