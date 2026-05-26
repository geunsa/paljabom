# 팔자봄 만세력 배포 가이드 (Deployment Guide)

이 프로젝트는 **파이썬(Python) FastAPI 백엔드**와 **HTML/CSS/JS 프론트엔드**가 함께 동작하는 하이브리드 앱입니다. 

사주 연산 라이브러리(`sajupy`, `korean_lunar_calendar`)를 실행해야 하므로 **단순한 정적 호스팅 서비스(Netlify의 기본 기능)만으로는 전체 앱을 작동시킬 수 없습니다.** 

따라서 다음 두 가지 방법 중 하나를 선택하여 배포해야 합니다.

---

## 🚀 방법 A. Render.com에 통합 배포 (가장 추천 ⭐)

Render.com은 파이썬 백엔드를 무료/저렴하게 실행할 수 있는 클라우드 서비스입니다. 이미 백엔드 코드가 프론트엔드 정적 파일들을 함께 서빙하도록 구성되어 있기 때문에, **여기에 한 번만 배포하면 프론트엔드와 백엔드가 하나의 주소로 묶여 아주 간단하게 배포가 완료**됩니다.

### 단계 1: GitHub에 코드 올리기
1. 개인 GitHub 계정에 새로운 repository(저장소)를 생성합니다.
2. 로컬 프로젝트 폴더 전체를 GitHub에 업로드(push)합니다.
   * `backend/` 폴더와 `frontend/` 폴더가 모두 포함되어야 합니다.

### 단계 2: Render.com 설정
1. [Render.com](https://render.com/)에 회원가입 후 로그인을 진행합니다.
2. 대시보드 우측 상단의 **[New +]** -> **[Web Service]**를 클릭합니다.
3. GitHub 계정을 연동한 후, 방금 올린 만세력 repository를 선택합니다.
4. 아래와 같이 설정 값을 입력합니다:
   * **Name**: `paljabom-manse` (원하는 이름)
   * **Region**: 한국과 가까운 지역 선택 (예: `Singapore` 또는 `Oregon`)
   * **Branch**: `main` (혹은 코드가 들어있는 브랜치)
   * **Runtime**: `Python`
   * **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt
     ```
   * **Start Command**: 
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   * **Instance Type**: `Free` (무료 요금제) 선택
5. 맨 아래 **[Create Web Service]** 버튼을 누르면 배포가 진행됩니다.
6. 약 2~3분 뒤 빌드가 성공하면 제공되는 `https://paljabom-manse.onrender.com` 과 같은 주소로 접속하여 모바일 만세력을 바로 사용할 수 있습니다!

---

## 🌐 방법 B. Netlify(프론트) + Render.com(백엔드) 분리 배포

꼭 Netlify 도메인이나 Netlify 호스팅을 메인으로 사용하고 싶으시다면, 백엔드는 파이썬 실행용(Render.com)으로 따로 배포하고 프론트엔드만 Netlify에 올린 뒤 서로 연결해야 합니다.

### 단계 1: 백엔드 배포 (Render.com)
1. **방법 A**와 동일하게 Render.com에 저장소를 연동하여 Web Service를 생성합니다.
2. 설정 값을 입력할 때, 동일하게 진행하여 백엔드를 배포합니다.
3. 배포 완료 후 제공되는 API 주소(예: `https://paljabom-api.onrender.com`)를 복사해 둡니다.

### 단계 2: 프론트엔드 코드 수정 (API 주소 연결)
1. 로컬 프로젝트의 `frontend/index.html` 파일을 엽니다.
2. 가장 하단(367번째 줄 부근)의 script 코드를 찾습니다:
   ```html
   <script>
     window.BACKEND_API_BASE = ""; // 기존 코드
   </script>
   ```
3. 큰따옴표 안에 방금 배포한 Render 백엔드 주소를 입력하고 저장합니다. (마지막 슬래시 `/` 는 생략합니다.)
   ```html
   <script>
     window.BACKEND_API_BASE = "https://paljabom-api.onrender.com";
   </script>
   ```
4. 수정한 코드를 GitHub에 커밋하고 푸시합니다.

### 단계 3: Netlify에 프론트엔드 배포
1. [Netlify](https://www.netlify.com/)에 로그인합니다.
2. **[Add new site]** -> **[Import an existing project]**를 누르고 GitHub을 연동합니다.
3. 저장소를 선택한 후 배포 설정을 입력합니다:
   * **Base directory**: `frontend` (프론트엔드 폴더만 배포하기 위함)
   * **Build command**: 비워둡니다 (정적 파일이므로 빌드가 필요 없습니다)
   * **Publish directory**: `.` (또는 `frontend` 폴더 내부의 경로이므로 비워두거나 `.` 설정)
4. **[Deploy]** 버튼을 누르면 배포가 완료되며, Netlify 주소로 접속하면 동작합니다.
