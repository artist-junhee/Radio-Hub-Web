import fs from 'fs';
import path from 'path';

const rawRadioText = `#EXTM3U

# ===== 서울 =====
#EXTINF:-1,KBS 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio
#EXTINF:-1,KBS 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio
#EXTINF:-1,KBS 3라디오
https://radio.bsod.kr/stream?stn=kbs&ch=3radio
#EXTINF:-1,KBS 1FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm
#EXTINF:-1,KBS 2FM
https://radio.bsod.kr/stream?stn=kbs&ch=2fm
#EXTINF:-1,KBS 한민족방송
https://radio.bsod.kr/stream?stn=kbs&ch=hanminjok
#EXTINF:-1,MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm
#EXTINF:-1,MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u
#EXTINF:-1,MBC mini 올댓뮤직
https://radio.bsod.kr/stream?stn=mbc&ch=chm
#EXTINF:-1,MBC 보이는 라디오
https://radio.bsod.kr/stream?stn=mbc&ch=bora
#EXTINF:-1,SBS 러브FM
https://radio.bsod.kr/stream?stn=sbs&ch=lovefm
#EXTINF:-1,SBS 파워FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm
#EXTINF:-1,SBS 고릴라디오M
https://radio.bsod.kr/stream?stn=sbs&ch=dmb
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,OBS 라디오
https://radio.bsod.kr/stream?stn=obs
#EXTINF:-1,iFM 경인방송
https://radio.bsod.kr/stream?stn=ifm
#EXTINF:-1,YTN 라디오
https://radio.bsod.kr/stream?stn=ytn
#EXTINF:-1,TBS FM
https://radio.bsod.kr/stream?stn=tbs&ch=fm
#EXTINF:-1,TBS eFM
https://radio.bsod.kr/stream?stn=tbs&ch=efm
#EXTINF:-1,TBN 경인교통방송
https://radio.bsod.kr/stream?stn=tbn
#EXTINF:-1,CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm
#EXTINF:-1,CBS 음악FM
https://radio.bsod.kr/stream?stn=cbs&ch=mfm
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 서울극동방송
https://radio.bsod.kr/stream?stn=febc
#EXTINF:-1,BBS 서울불교방송
https://radio.bsod.kr/stream?stn=bbs
#EXTINF:-1,CPBC 가톨릭평화방송
https://radio.bsod.kr/stream?stn=cpbc
#EXTINF:-1,WBS 서울원음방송
https://radio.bsod.kr/stream?stn=wbs
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,국악방송
https://radio.bsod.kr/stream?stn=kugak
#EXTINF:-1,AFN FM Humphreys
https://radio.bsod.kr/stream?stn=afn&city=humphreys
#EXTINF:-1,관악FM
https://radio.bsod.kr/stream?stn=community&ch=gwanakfm
#EXTINF:-1,마포FM
https://radio.bsod.kr/stream?stn=community&ch=mapofm
#EXTINF:-1,성남FM
https://radio.bsod.kr/stream?stn=community&ch=seongnamfm
#EXTINF:-1,서대문FM
https://radio.bsod.kr/stream?stn=community&ch=sdmfm
#EXTINF:-1,수원FM
https://radio.bsod.kr/stream?stn=community&ch=sonefm
#EXTINF:-1,GO구리FM
https://radio.bsod.kr/stream?stn=community&ch=gurifm
#EXTINF:-1,단원FM
https://radio.bsod.kr/stream?stn=community&ch=dwfm

# ===== 부산 =====
#EXTINF:-1,KBS부산 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=busan
#EXTINF:-1,KBS부산 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=busan
#EXTINF:-1,KBS부산 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=busan
#EXTINF:-1,KBS울산 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=ulsan
#EXTINF:-1,KBS창원 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=changwon
#EXTINF:-1,KBS창원 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=changwon
#EXTINF:-1,KBS창원 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=changwon
#EXTINF:-1,KBS진주 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=jinju
#EXTINF:-1,부산MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=busan
#EXTINF:-1,부산MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=busan
#EXTINF:-1,울산MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=ulsan
#EXTINF:-1,울산MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=ulsan
#EXTINF:-1,MBC경남 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=changwon
#EXTINF:-1,MBC경남 FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=changwon
#EXTINF:-1,KNN 러브FM
https://radio.bsod.kr/stream?stn=sbs&ch=lovefm&city=busan
#EXTINF:-1,KNN 파워FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=busan
#EXTINF:-1,UBC 그린FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=ulsan
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 부산교통방송
https://radio.bsod.kr/stream?stn=tbn&city=busan
#EXTINF:-1,TBN 울산교통방송
https://radio.bsod.kr/stream?stn=tbn&city=ulsan
#EXTINF:-1,TBN 경남교통방송
https://radio.bsod.kr/stream?stn=tbn&city=gyeongnam
#EXTINF:-1,부산CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=busan
#EXTINF:-1,부산CBS 음악FM
https://radio.bsod.kr/stream?stn=cbs&ch=mfm&city=busan
#EXTINF:-1,울산CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=ulsan
#EXTINF:-1,경남CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=gyeongnam
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 부산극동방송
https://radio.bsod.kr/stream?stn=febc&city=busan
#EXTINF:-1,FEBC 울산극동방송
https://radio.bsod.kr/stream?stn=febc&city=ulsan
#EXTINF:-1,FEBC 창원극동방송
https://radio.bsod.kr/stream?stn=febc&city=changwon
#EXTINF:-1,BBS 부산불교방송
https://radio.bsod.kr/stream?stn=bbs&city=busan
#EXTINF:-1,CPBC 부산가톨릭평화방송
https://radio.bsod.kr/stream?stn=cpbc&city=busan
#EXTINF:-1,WBS 부산원음방송
https://radio.bsod.kr/stream?stn=wbs&city=busan
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,부산영어방송
https://radio.bsod.kr/stream?stn=befm
#EXTINF:-1,연제공동체라디오
https://radio.bsod.kr/stream?stn=community&ch=yeonjefm
#EXTINF:-1,남해FM
https://radio.bsod.kr/stream?stn=community&ch=namhaefm

# ===== 대구 =====
#EXTINF:-1,KBS대구 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=daegu
#EXTINF:-1,KBS대구 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=daegu
#EXTINF:-1,KBS대구 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=daegu
#EXTINF:-1,KBS안동 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=andong
#EXTINF:-1,KBS포항 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=pohang
#EXTINF:-1,대구MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=daegu
#EXTINF:-1,대구MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=daegu
#EXTINF:-1,안동MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=andong
#EXTINF:-1,안동MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=andong
#EXTINF:-1,포항MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=pohang
#EXTINF:-1,포항MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=pohang
#EXTINF:-1,TBC 드림FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=daegu
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 대구교통방송
https://radio.bsod.kr/stream?stn=tbn&city=daegu
#EXTINF:-1,TBN 경북교통방송
https://radio.bsod.kr/stream?stn=tbn&city=gyeongbuk
#EXTINF:-1,대구CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=daegu
#EXTINF:-1,대구CBS 음악FM
https://radio.bsod.kr/stream?stn=cbs&ch=mfm&city=daegu
#EXTINF:-1,포항CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=pohang
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 대구극동방송
https://radio.bsod.kr/stream?stn=febc&city=daegu
#EXTINF:-1,FEBC 포항극동방송
https://radio.bsod.kr/stream?stn=febc&city=pohang
#EXTINF:-1,BBS 대구불교방송
https://radio.bsod.kr/stream?stn=bbs&city=daegu
#EXTINF:-1,CPBC 대구가톨릭평화방송
https://radio.bsod.kr/stream?stn=cpbc&city=daegu
#EXTINF:-1,WBS 대구원음방송
https://radio.bsod.kr/stream?stn=wbs&city=daegu
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,AFN FM Daegu
https://radio.bsod.kr/stream?stn=afn&city=daegu
#EXTINF:-1,성서공동체FM
https://radio.bsod.kr/stream?stn=community&ch=scnfm
#EXTINF:-1,대구동구FM
https://radio.bsod.kr/stream?stn=community&ch=daegufm
#EXTINF:-1,영주FM
https://radio.bsod.kr/stream?stn=community&ch=yeongjufm
#EXTINF:-1,성주FM
https://radio.bsod.kr/stream?stn=community&ch=sjfm
#EXTINF:-1,상주FM
https://radio.bsod.kr/stream?stn=community&ch=sangjufm

# ===== 광주 =====
#EXTINF:-1,KBS광주 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=gwangju
#EXTINF:-1,KBS광주 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=gwangju
#EXTINF:-1,KBS광주 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=gwangju
#EXTINF:-1,KBS목포 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=mokpo
#EXTINF:-1,KBS목포 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=mokpo
#EXTINF:-1,KBS순천 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=suncheon
#EXTINF:-1,광주MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=gwangju
#EXTINF:-1,광주MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=gwangju
#EXTINF:-1,목포MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=mokpo
#EXTINF:-1,목포MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=mokpo
#EXTINF:-1,여수MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=yeosu
#EXTINF:-1,여수MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=yeosu
#EXTINF:-1,KBC 마이FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=gwangju
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 광주교통방송
https://radio.bsod.kr/stream?stn=tbn&city=gwangju
#EXTINF:-1,광주CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=gwangju
#EXTINF:-1,광주CBS 음악FM
https://radio.bsod.kr/stream?stn=cbs&ch=mfm&city=gwangju
#EXTINF:-1,전남CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=jeonnam
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 광주극동방송
https://radio.bsod.kr/stream?stn=febc&city=gwangju
#EXTINF:-1,FEBC 목포극동방송
https://radio.bsod.kr/stream?stn=febc&city=mokpo
#EXTINF:-1,FEBC 전남동부극동방송
https://radio.bsod.kr/stream?stn=febc&city=jeonnam
#EXTINF:-1,BBS 광주불교방송
https://radio.bsod.kr/stream?stn=bbs&city=gwangju
#EXTINF:-1,CPBC 광주가톨릭평화방송
https://radio.bsod.kr/stream?stn=cpbc&city=gwangju
#EXTINF:-1,WBS 광주원음방송
https://radio.bsod.kr/stream?stn=wbs&city=gwangju
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,글로벌광주방송
https://radio.bsod.kr/stream?stn=ggn
#EXTINF:-1,광주국악방송
https://radio.bsod.kr/stream?stn=kugak&city=gwangju
#EXTINF:-1,광주FM
https://radio.bsod.kr/stream?stn=community&ch=kjfm
#EXTINF:-1,GBS고려방송
https://radio.bsod.kr/stream?stn=community&ch=crfm
#EXTINF:-1,순천미디어네트워크
https://radio.bsod.kr/stream?stn=community&ch=suncheonfm

# ===== 대전 =====
#EXTINF:-1,KBS대전 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=daejeon
#EXTINF:-1,KBS대전 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=daejeon
#EXTINF:-1,KBS대전 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=daejeon
#EXTINF:-1,대전MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=daejeon
#EXTINF:-1,대전MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=daejeon
#EXTINF:-1,TJB 파워FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=daejeon
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 대전교통방송
https://radio.bsod.kr/stream?stn=tbn&city=daejeon
#EXTINF:-1,TBN 충남교통방송
https://radio.bsod.kr/stream?stn=tbn&city=chungnam
#EXTINF:-1,대전CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=daejeon
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 대전극동방송
https://radio.bsod.kr/stream?stn=febc&city=daejeon
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,대전국악방송
https://radio.bsod.kr/stream?stn=kugak&city=daejeon
#EXTINF:-1,금강FM
https://radio.bsod.kr/stream?stn=community&ch=keumkangfm
#EXTINF:-1,세종FM
https://radio.bsod.kr/stream?stn=community&ch=sejongfm
#EXTINF:-1,한밭FM
https://radio.bsod.kr/stream?stn=community&ch=hanbatfm

# ===== 강원 =====
#EXTINF:-1,KBS춘천 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=chuncheon
#EXTINF:-1,KBS춘천 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=chuncheon
#EXTINF:-1,KBS춘천 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=chuncheon
#EXTINF:-1,KBS강릉 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=gangneung
#EXTINF:-1,KBS강릉 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=gangneung
#EXTINF:-1,KBS원주 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=wonju
#EXTINF:-1,KBS원주 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=wonju
#EXTINF:-1,춘천MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=chuncheon
#EXTINF:-1,춘천MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=chuncheon
#EXTINF:-1,원주MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=wonju
#EXTINF:-1,원주MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=wonju
#EXTINF:-1,MBC강원영동 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=gangneung
#EXTINF:-1,MBC강원영동 FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=gangneung
#EXTINF:-1,G1 프레쉬FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=chuncheon
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 강원교통방송
https://radio.bsod.kr/stream?stn=tbn&city=gangwon
#EXTINF:-1,춘천CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=chuncheon
#EXTINF:-1,강원영동CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=youngdong
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 강원극동방송
https://radio.bsod.kr/stream?stn=febc&city=gangwon
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,태백FM
https://radio.bsod.kr/stream?stn=community&ch=taebaekfm

# ===== 충북 =====
#EXTINF:-1,KBS청주 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=cheongju
#EXTINF:-1,KBS청주 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=cheongju
#EXTINF:-1,KBS청주 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=cheongju
#EXTINF:-1,KBS충주 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=chungju
#EXTINF:-1,KBS충주 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=chungju
#EXTINF:-1,MBC충북 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=cheongju
#EXTINF:-1,MBC충북 FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=cheongju
#EXTINF:-1,CJB 조이FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=cheongju
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 충북교통방송
https://radio.bsod.kr/stream?stn=tbn&city=chungbuk
#EXTINF:-1,충북CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=cheongju
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,옥천FM
https://radio.bsod.kr/stream?stn=community&ch=obn

# ===== 전북 =====
#EXTINF:-1,KBS전주 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=jeonju
#EXTINF:-1,KBS전주 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=jeonju
#EXTINF:-1,KBS전주 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=jeonju
#EXTINF:-1,전주MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=jeonju
#EXTINF:-1,전주MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=jeonju
#EXTINF:-1,JTV 매직FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=jeonju
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 전북교통방송
https://radio.bsod.kr/stream?stn=tbn&city=jeonbuk
#EXTINF:-1,전북CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=jeonbuk
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 전북극동방송
https://radio.bsod.kr/stream?stn=febc&city=jeonbuk
#EXTINF:-1,WBS 전북원음방송
https://radio.bsod.kr/stream?stn=wbs&city=jeonbuk
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,AFN FM Kunsan
https://radio.bsod.kr/stream?stn=afn&city=kunsan
#EXTINF:-1,전주FM
https://radio.bsod.kr/stream?stn=community&ch=jcfm

# ===== 제주 =====
#EXTINF:-1,KBS제주 1라디오
https://radio.bsod.kr/stream?stn=kbs&ch=1radio&city=jeju
#EXTINF:-1,KBS제주 2라디오
https://radio.bsod.kr/stream?stn=kbs&ch=2radio&city=jeju
#EXTINF:-1,KBS제주 음악FM
https://radio.bsod.kr/stream?stn=kbs&ch=1fm&city=jeju
#EXTINF:-1,제주MBC 표준FM
https://radio.bsod.kr/stream?stn=mbc&ch=sfm&city=jeju
#EXTINF:-1,제주MBC FM4U
https://radio.bsod.kr/stream?stn=mbc&ch=fm4u&city=jeju
#EXTINF:-1,JIBS 뉴파워FM
https://radio.bsod.kr/stream?stn=sbs&ch=powerfm&city=jeju
#EXTINF:-1,EBS FM
https://radio.bsod.kr/stream?stn=ebs&ch=fm
#EXTINF:-1,EBS 반디 외국어 전문
https://radio.bsod.kr/stream?stn=ebs&ch=bandi
#EXTINF:-1,TBN 제주교통방송
https://radio.bsod.kr/stream?stn=tbn&city=jeju
#EXTINF:-1,제주CBS 표준FM
https://radio.bsod.kr/stream?stn=cbs&ch=sfm&city=jeju
#EXTINF:-1,CBS JOY4U
https://radio.bsod.kr/stream?stn=cbs&ch=joy4u
#EXTINF:-1,FEBC 제주극동방송
https://radio.bsod.kr/stream?stn=febc&city=jeju
#EXTINF:-1,BBS 제주불교방송
https://radio.bsod.kr/stream?stn=bbs&city=jeju
#EXTINF:-1,국방FM
https://radio.bsod.kr/stream?stn=kookbang
#EXTINF:-1,Arirang Radio
https://radio.bsod.kr/stream?stn=arirang

===== 해외 한인 방송 =====
#EXTINF:-1,DKnet
https://s2.radio.co/sa6920367a/listen?ver=872340
#EXTINF:-1,K-RADIO (AM 1310)
https://s5.radio.co/s0a9796fe3/listen
#EXTINF:-1,K-RADIO (AM 1660)
https://streams.radio.co/s839c1142b/listen
#EXTINF:-1,라디오 서울
http://onair1.radioseoul1650.com:8000/radioseoul.mp3
#EXTINF:-1,라디오 한국
http://50.222.186.230:8080/stream
#EXTINF:-1,샌디에고 라디오 코리아
https://play.radioking.io/san-diego-radio-korea2
#EXTINF:-1,라디오코리아
https://onairweb.radiokorea.com/live;stream/1
#EXTINF:-1,라디오코리아 뉴욕
https://das-edge63-live365-dal03.cdnstream.com/a48202
#EXTINF:-1,애틀랜타 라디오 코리아
https://s2.radio.co/s481a3f747/listen
#EXTINF:-1,우리방송
https://free.rcast.net/72974
#EXTINF:-1,한미라디오
http://107.140.67.161:8000/stream`;

// Also save raw 라디오.txt in the root or public so the original file is preserved verbatim
fs.writeFileSync('라디오.txt', rawRadioText, 'utf-8');

const lines = rawRadioText.split(/\r?\n/);
let currentCategory = '';
const categories = [];
const stations = [];
let pendingName = '';
let count = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  if (line === '#EXTM3U') continue;

  // Check category header: e.g. "# ===== 서울 =====" or "===== 해외 한인 방송 ====="
  const catMatch = line.match(/^#?\s*={3,}\s*(.+?)\s*={3,}$/);
  if (catMatch) {
    currentCategory = catMatch[1].trim();
    if (!categories.includes(currentCategory)) {
      categories.push(currentCategory);
    }
    continue;
  }

  if (line.startsWith('#EXTINF:')) {
    const commaIdx = line.indexOf(',');
    if (commaIdx !== -1) {
      pendingName = line.substring(commaIdx + 1).trim();
    } else {
      pendingName = line.replace('#EXTINF:', '').trim();
    }
    continue;
  }

  // It's a stream URL
  if (line.startsWith('http://') || line.startsWith('https://')) {
    count++;
    const stationName = pendingName || `방송국 ${count}`;
    const id = `stn-${count}`;
    
    stations.push({
      id,
      name: stationName,
      url: line,
      category: currentCategory || '기타',
      isCustom: false,
    });
    pendingName = '';
  }
}

const dataDir = path.resolve('src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'stations.json'), JSON.stringify(stations, null, 2), 'utf-8');
fs.writeFileSync(path.join(dataDir, 'initialCategories.json'), JSON.stringify(categories, null, 2), 'utf-8');

console.log(`Parsed ${stations.length} stations across ${categories.length} categories:`);
console.log(categories);
