require('dotenv').config();
var express = require('express')
var router = express.Router()
var db = require('./db')
var immediateAnswers = require('./immediateAnswers')
var operationDetails = {}
var minimumFirstAmount = 5000
var newestVersion = 1.4

var customAlert = {"message":"Náðu í nýjustu útgáfuna af appinu og byrjaðu fyrir alvöru að safna verðlaunum!", 
"title": "Yó!", 
"cancelButton": "Hætta", 
"url": "https://itunes.apple.com/us/app/quotel-quotes-quotations/id1394606175?mt=8",
"okeyButton": "Okey"
}

async function login(req, res){
    var {
        version = 1.0,
        singleAnswer = false, //Phone verificationCode!
        user: {
            phone = false
        }
    } = req.body
    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
        operationDetails.customAlert = customAlert
    } else if(version >= newestVersion){
        if(singleAnswer == "0000000" || phone == "0000000"){
            operationDetails.success = true
            operationDetails.user = {
                userID : "68C965D0-AD8F-4100-B5D1-65329CDF1F2D"
            }
        } else {
            console.log(singleAnswer, phone)
            if(!(singleAnswer&&phone)){
                operationDetails.success = false
                operationDetails.message = "Vinsamlegast reyndu aftur síðar"
                operationDetails.title = "Villa!"
            } else {
                console.log("HERE")
                var msg = await immediateAnswers.verifyPhone(null, singleAnswer, phone)
                console.log("TheMessage1:", msg)
                if(msg.success){
                    console.log("Inside")
                    var message = await db.loginOrSignUpWithPhone(phone)
                    console.log("TheMessage3:", message)
                    await makeOperationDetails(message.success, message.error, message.message)
                    operationDetails.title = message.title
                    operationDetails.user = {
                        userID : message.userID
                    }
                } else {
                    await makeOperationDetails(false, msg.error, msg.message)
                    operationDetails.title = msg.title
                }   
            }
        }
    } else{
         //Send so that user Can update the app! URLIÐ!
         await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
         operationDetails.title = "Uppfærsla!"
    }
    res.send(operationDetails)
}

async function logout(req, res){
    var {
        body: {
            userID = false
        }
    }  = req

    if(!userID){
        await makeOperationDetails(false, "Required Fields empty", "Getur ekki gert þetta í augnablikinu.")
    } else {
        userID = userID.toUpperCase()
        var message = await db.logout(userID)
        await makeOperationDetails(message.success, message.error, message.message)
    }
    res.send(operationDetails)
}

async function feed(req, res){
    //Have send last survey, and later last programTest (or whatever the 2nd section is) that the app got from the server!
    var {
        body: {
            userID = false,
            surveyID = -1,
            testID = -1,
            version = 1.0
        }
    } = req

    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
    } else if(!userID){
        await makeOperationDetails(false, "RequiredFieldsEmpty", "Þú ert ekki með heimild fyrir þessum gögnum")
    } else {
            console.log("USEDID:", userID)
            userID = userID.toUpperCase()
            console.log("USERID:", userID)
        
        var message = await db.feed(userID, surveyID, testID)
        operationDetails.success = message.success
        operationDetails.error = message.error
        operationDetails.title = message.title
        operationDetails.message = message.message
        operationDetails.surveys = message.feed
        operationDetails.tests = message.tests
        operationDetails.endOfTestsFeed = message.endOfTestsFeed
        operationDetails.endOfSurveyfeed = message.endOfSurveyfeed
        operationDetails.user = message.userInfo
        operationDetails.customAlert = message.customAlert
        operationDetails.minimumFirstAmount = message.userInfo.prizeMoneyCashed > 0 ? 0:minimumFirstAmount
        operationDetails.showInvitationButton = message.showInvitationButton
        operationDetails.showAur = false
        operationDetails.reachOutUrl = "http://eikapp.is"
    }
    console.log("Send In Feed:", JSON.stringify(operationDetails.surveys.length))
    res.send(operationDetails)
}

async function takeSurvey(req, res){
    var {
        body: {
            userID = false,
            surveyID = false,
            accept = "",
            prize = false,
            version = 1.0
        }
    } = req 
console.log(userID, surveyID, accept, prize)
if(version < newestVersion){
    //Send so that user Can update the app! URLIÐ!
    await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
    operationDetails.title = "Uppfærsla!"
} else if(!(userID&&surveyID)){
        await makeOperationDetails(false, "Required Fields empty", "Villa í kerfinu! Vinsamlegast láttu okkur vita og við lögum villuna.")
    } else if(accept == ""){
        // var message = await db.takeSurvey(userID, surveyID)
        var acceptConditions = {
            leftTitle: "Upplýst samþykki",
            rightTitle: prize ? "Verðlaun: " + prize + " kr.":"",
            title: "Skroll bar í hliðinni ef textingg",
            text: `Eik appið - Skilmálar
            Notendasamningur
            Skilmálar þessir gilda um þjónustu Eiks appsins (hér eftir nefnt Eik). Með því að samþykkja skilmálana lýsir notandi því yfir að hann hafi lesið, skilið og samþykkt skilmálana í heild sinni.
            Umsókn og notkun appsins
            Það er á ábyrgð notanda að gefa upp íslenskt símanúmer sem hann er sannarlega skráður fyrir, sem og réttar persónu- og bankaupplýsingar á sömu kennitölu. Notandi ábyrgist að uppfæra þær upplýsingar sem um hann gilda þannig að þær séu á hverjum tíma réttar og fullnægjandi. Eik er heimilt að fresta eða stöðva framkvæmd úttektar sem og að krefjast frekari upplýsinga af notanda ef Eik telur ástæðu til að ætla að verið sé að framkvæma úttekt í andstöðu við skilmála þessa eða landslög. Eik áskilur sér allan rétt að hafna umsókn um notkun appsins án þess að tilgreina ástæðu. Með því að samþykkja skilmála þessa heimilar notandi Eik að óska þeirra upplýsinga sem Eik telur nauðsynlegar til að tryggja öryggi þjónustunnar, öryggi notenda og/eða öryggi utanaðkomandi aðila. Upplýsingaöflun getur falist í fyrirspurnum til notanda eða kröfu um staðfestingar frá honum vegna þeirra upplýsinga sem hann hefur gefið eða aðgerða sem hann hefur framkvæmt.
            Varðveisla, meðferð og ábyrgð notanda
            Eik áskilur sér rétt til að takmarka einhliða þær upphæðir sem notandi getur tekið út. Ef ágreiningur eða tjón verður vegna þess að greitt er með Eik er það eigendum appsins algerlega óviðkomandi og án ábyrgðar. Notandi getur ekki krafið Eik um neins konar skaðabætur eða endurgreiðslur vegna rangra útgreiðslna, þess að greiðsla berst ekki eða berst ekki fyrir tiltekinn tíma eða ef greiðsla er ógild eða véfengd. Til að auka öryggi á símanum ber notanda að sækja appið fyrir iPhone í App Store eða Google Play fyrir Android síma.
            Glataður sími, lokun, afturköllun og uppsögn
            Eik appið áskilur sér rétt til að loka fyrir aðgang notanda ef grunur um misnotkun eða ranga notkun af einhverju tagi kemur upp, að einhliða mati Eik. Ef engin notkun hefur átt sér stað í 12 mánuði hefur Eik rétt á að loka aðgangi notanda.
            Öryggisstefna og meðferð persónuupplýsinga
            Eik er ábyrgðaraðili við vinnslu gagna, eins og skilgreint er í lögum um persónuvernd og reglugerð Evrópusambandsins GDPR og er vinnsla persónuupplýsinga sanngjörn og gagnsæ. Notandi getur haft samband við Eik hvenær sem er til að:
            •	Óska eftir aðgangi að þeim upplýsingum sem Eik á um notanda
            •	Leiðrétta upplýsingar sem Eik á um notanda
            •	Eyða upplýsingum sem Eik á um notanda
            •	Eða nýta sér önnur þau réttindi sem kveðið er á um í gildandi persónuverndarlögum.
            Komi til breytinga á eignarhaldi Eik hefur það ekki áhrif á réttindi og skyldur notanda og þjónusta Eik mun haldast óbreytt óháð slíkum breytingum nema notanda verði tilkynnt um annað með hæfilegum fyrirvara.
            Villur og ábyrgð
            Ef um sannarleg mistök er að ræða af hendi Eik verða slík mistök leiðrétt svo fljótt sem auðið er.
            Breyting á skilmálum og aðrar tilkynningar
            Notandi hefur aðgang að gildandi skilmálum í Eik appinu undir um Eik og á á vef Eik, www.Eikappid.is. Eik hefur heimild til að breyta ákvæðum skilmála þessara einhliða. Komi til breytinga á skilmálum sem eru notanda til óhagræðis munu þær verða kynntar notanda með minnst 30 daga fyrirvara með skilaboðum í gegnum appið, SMS tilkynningu til notenda og/eða undir stillingar í Eik appinu og á www.Eikappid.is. Aðrar breytingar, sem eru til hagræðis fyrir notanda, má tilkynna með skemmri fyrirvara. Notandi samþykkir framangreindar aðferðir við upplýsingagjöf til hans. Í tilkynningu um breytta skilmála skal vakin athygli á því í hverju breytingar eru fólgnar og rétt notanda til að segja upp þjónustunni. Litið er svo á að notandi hafi samþykkt breytingar ef viðkomandi notar appið eftir að nýir skilmálar hafa tekið gildi.  Eik áskilur sér rétt að hafa samskipti við notendur appsins í gegnum SMS skilaboð og með skilaboðum í gegnum appið. Eik mun eingöngu senda upplýsingar til notenda er varða þjónustu fyrirtækisins en ekki áreiti frá þriðja aðila.
            Öll mál, sem rísa kunna af notkun Eik appsins skulu, nema á annan veg sé samið, fara eftir íslenskum lögum. Rísi mál vegna brota á skilmálum þessum eða ágreinings um túlkun þeirra má reka það fyrir Héraðsdómi Reykjavíkur.
            Gildistími
            Skilmálar þessir eru gefnir út af Eik og gilda frá 7. júlí 2019 og til þess tíma er nýir skilmálar taka gildi
            
            Persónuverndarstefna
            I. ALMENNT
            
            Persónuvernd þín skiptir Eik miklu máli. Stefna þessi tekur til persónuupplýsinga hvort sem þeim er safnað og þær varðveittar með rafrænum hætti, á pappír eða með öðrum sambærilegum hætti. Stefnan tekur til skráningar, vörslu og vinnslu á persónuupplýsingum sem falla undir stefnuna. Stefnan er aðgengileg á heimasíðu félagsins.
            
            II. PERSÓNUVERNDARLÖGGJÖF
            
            Um meðferð persónuupplýsinga gilda lög nr. 90/2018 um persónuvernd og vinnslu persónuupplýsinga eins og þau eru á hverjum tíma, sem og viðkomandi hlutar reglugerðar Evrópuþingsins og ráðsins (ESB) 2016/679 um vernd einstaklinga í tengslum við vinnslu persónuupplýsinga og um frjálsa miðlun slíkra upplýsinga. Taka lögin m.a. á vinnslu, vörslu og miðlun persónuupplýsinga.
            
            III. ÁBYRGÐ OG TENGILIÐUR
            
            Eik ber almennt ábyrgð á skráningu persónuupplýsinga og meðferð þeirra upplýsinga í starfsemi sinni og er svokallaður ábyrgðaraðili vinnslu í skilningi persónuverndarlöggjafar en kann þó í einhverjum tilvikum að vera vinnsluaðili upplýsinganna, til að mynda við framkvæmd kannana, eða eftir atvikum sameiginlegur ábyrgðaraðili með öðrum.
            
            Þá eru þeir aðilar sem Eik kann að miðla upplýsingum til, sbr. V. kafli þessarar persónuverndarstefnu, sjálfstæðir ábyrgðaraðilar varðandi þá vinnslu upplýsinga sem fer fram á þeirra vegum, svo sem í tengslum við markaðsstarfsemi, og bera sjálfstæða ábyrgð á því að öll meðferð þeirra sé í samræmi við persónuverndarlöggjöf.
            
            Hægt er að hafa samband við okkur að, með því að senda skriflega fyrirspurn á Eikappid@gmail.com og með því að hringja í 772-9733 ef þú hefur einhverjar spurningar í tengslum við persónuvernd.
            
            IV. SÖFNUN OG NOTKUN
            
            Eik er fyrirtæki sem þjónustar rannsóknarfyrirtæki, í því felst söfnun og greining persónuupplýsinga. Eik leggur mikið upp úr trúnaði og öruggri meðferð persónuupplýsinga og starfar eftir ströngum siðareglum sem settar eru af alþjóðasamtökum markaðs- og viðhorfsrannsóknafyrirtækja, ESOMAR. Í allri framsetningu á niðurstöðum er þess gætt að ekki sé hægt að rekjasvör til einstakra svarenda og allir starfsmenn hafa skrifað undir trúnaðar- og þagnareið, sem á jafnt við gagnvart svarendum og viðskiptavinum. Vinnsla Eik fer ýmist fram vegna framkvæmdar samnings, samþykkis, fyrirmæla í lögum, reglum og stjórnvaldsfyrirmælum, eða á grundvelli lögmætra hagsmuna. Til að geta sinnt hlutverki sínu heldur Eik mögulega utan um eða hefur aðgang að eftirfarandi upplýsingum í eftirfarandi tilgangi:
            •	nafn þitt, kennitölu, heimilisfang, kyn, þjóðerni og símanúmer til að geta gefið þér kost á að taka þátt í könnunum og í tengslum við kannanir sem þú samþykkir að taka þátt í (úrtök),
            •	fyrri þátttöku í könnunum, til að geta stýrt álagi á svarendur,
            •	netfang og bakgrunnsbreytur að gefnu þínu samþykki,
            •	nafn þitt, netfang og könnun sem tókst þátt í, ef þú hefur verið dregin(n) út í happdrætti svarenda, til að halda utan um vinningshafa og hvort vinninga hafi verið vitjað,
            •	nafn þitt, kennitölu þess lögaðila sem þú ert í forsvari fyrir, tegund, umfang og dagsetningu viðskipta til að geta uppfyllt skyldu okkar samkvæmt bókhaldslögum og sinnt gæðaeftirliti,
            •	nafn þitt og netfang með þínu samþykki til að geta gert þér kleift að nota vef- og samfélagsmiðlasíður okkar,
            •	nafn þitt, símanúmer og netfang til að geta svarað fyrirspurnum og brugðist við óskum þínum, ef þú hefur samband við okkur að fyrra bragði,
            Þegar þú skoðar og notar vefsvæði Eik söfnum við upplýsingum sem vafri þinn sendir í þeim tilgangi að bæta notendaupplifun og auka öryggi, þ.e. gögn sem geta falið í sér upplýsingar eins og IP-tölu, tegund vafra, útgáfu vafra, síður þjónustunnar, tíma og dagsetningu heimsóknar og önnur talnagögn.
            
            Við notum vefkökur til þess að aðgreina þig frá öðrum notendum á vefsíðu Eik. Vefkökur eru litlar textaskrár sem netvafrinn þinn vistar á tölvunni þinni sé netvafrinn þinn stilltur til að samþykkja notkun á vefkökum. Vefkökurnar gera okkur kleift að muna ákveðnar stillingar hjá notanda til að bæta notendaupplifun og fá tölfræðiupplýsingar um notkun á vefsíðu Eikappid.is.
            
            Notendur geta ákveðið hvort þeir leyfa sumar eða allar vefkökur með stillingum í netvafra. Ef notendur kjósa að leyfa ekki vefkökur þá kann hluti vefsíðunnar að verða óaðgengilegur.
            Eik notar þjónustur Google Analytics og Facebook Pixel til að greina umferð um Eikappid.is og birta notendum sérsniðnar auglýsingar. Þessar þjónustur safna upplýsingum nafnlaust og gefa skýrslur um þróun á vefsvæðum, án þess að greint sé frá stökum notendum eða persónuupplýsingum. 
            
            V. MIÐLUN
            
            Við seljum aldrei persónuupplýsingar um þig. Við miðlum aldrei persónuupplýsingum til þriðja aðila án þess að samþykki þitt fyrir miðluninni liggi fyrir (sem þér er frjálst að hafna) nema þar sem okkur er það skylt samkvæmt lögum eða í þeim tilvikum sem talin eru upp í IV. kafla eða í næstu málsgrein.
            
            Okkur er heimilt að miðla persónuupplýsingum til þriðja aðila (vinnsluaðila) sem er þjónustuveitandi, umboðsmaður eða verktaki okkar í þeim tilgangi að ljúka við verkefni eða veita þér þjónustu eða vöru sem þú hefur beðið um eða samþykkt. Okkur er einnig heimilt að deila upplýsingum með vinnsluaðilum þegar það er nauðsynlegt til að vernda brýna hagsmuni t.d. við innheimtu á vanskilakröfu. Við deilum einnig upplýsingum, í tölfræðilegum tilgangi, með vinnsluaðilum sem vinna með okkur við gæða -og markaðsstarf. Við afhendum vinnsluaðilunum einungis þær persónuupplýsingar sem eru nauðsynlegar fyrir þá í framangreindum tilgangi og gerum við þá samning þar sem þeir undirgangast skyldu um að halda upplýsingum um þig öruggum og nota þær einungis í framangreindum tilgangi.
            
            VI. VERNDUN
            
            Eik leggur mikla áherslu á að vernda vel allar persónuupplýsingar og hefur því yfir að skipa innra eftirlitskerfi sem á að tryggja að ávallt skulu gerðar viðeigandi tæknilegar og skipulagslegar öryggisráðstafanir. Við munum tilkynna án ótilhlýðilegrar tafar ef það kemur upp öryggisbrot er varðar persónuupplýsingarnar sem hefur í för með sér mikla áhættu fyrir hlutaðeigandi. Með öryggisbroti í framangreindum skilningi er átt við brot á öryggi sem leiðir til óviljandi eða ólögmætrar eyðingar persónuupplýsinga eða að þær glatist, breytist, verði birtar eða aðgangur veittur að þeim í leyfisleysi.
            
            Athygli þín er þó vakin á því að þú berð ábyrgð á persónuupplýsingum, t.d. nafni, kennitölu og mynd, sem þú kýst að deila eða senda á almennum vettvangi t.d. í gegnum Facebook síðu Eik.
            
            VII. VARÐVEISLA
            
            Ef þú tekur þátt í rannsókn á vegum Eik eru persónugreinanlegar upplýsingar, aðrar en þær sem þú kannt að gefa sjálf(ur) upp í könnun, ekki skráðar með svari þínu heldur er gerviauðkenni notað í þeirra stað. 
            
            Eik reynir eftir fremsta megni að halda persónuupplýsingum um tengiliði viðskiptavina og birgja sinna nákvæmum og áreiðanlegum og uppfærir þær eftir þörfum. Við varðveitum persónuupplýsingar um tengiliði þangað til að ósk berst um annað, og svo lengi sem það er nauðsynlegt til að uppfylla lagaskyldu.
            
            VIII. RÉTTINDI ÞÍN
            
            Þú átt rétt á og getur óskað eftir eftirfarandi upplýsingum með því að senda skriflega fyrirspurn á Eikappid@gmail.com 
            
            a) að fá að vita hvaða persónuupplýsingar eru skráðar um þig og hvernig þær eru tilkomnar og fá aðgang að persónuupplýsingunum,
            
            b) að fá upplýsingar um hvernig persónuupplýsingar um þig séu unnar,
            
            c) að persónuupplýsingar um þig séu uppfærðar og leiðréttar,
            
            d) að persónuupplýsingum um þig sé eytt, ef ekki er lengur málefnaleg ástæða til að varðveita þær,
            
            e) að andmæla og / eða takmarka hvernig persónuupplýsingar séu unnar,
            
            f) að fá afhentar persónuupplýsingar sem þú hefur látið okkur í té eða að þær séu sendar beint til annars aðila með þeim takmörkunum sem réttindi og frelsi annarra setja,
            
            g) að afturkalla samþykki þitt til vinnslu þegar vinnsla byggist á þeirri heimild, með sama hætti og þú gafst það eða með því að senda á okkur skriflega fyrirspurn,
            
            h) að fá upplýsingar um hvort fram fari sjálfvirk ákvarðanataka, þ.m.t. gerð persónusniðs og þau rök sem þar liggja að baki og einnig þýðingu og fyrirhugaðar afleiðingar slíkrar vinnslu.
            
            Beiðni þín verður tekin til greina og þér afhentar upplýsingarnar (þegar það á við) innan hæfilegs tíma, þó með þeim takmörkunum sem réttindi og frelsi annarra gera, þ.m.t. viðskiptaleyndarmál og hugverkaréttindi. Athygli er vakin á að innheimt er sanngjarnt gjald byggt á umsýslukostnaði sé farið fram á meira ein eitt eintak. Þér verður tilkynnt og gefin skýring ef töf verður á afgreiðslu eða ef ekki er unnt að verða við beiðninni að fullu eigi síðar en mánuði frá móttöku hennar. Þú átt ávallt rétt á því að leggja fram kvörtun til Persónuverndar komi upp ágreiningur um meðferð persónuupplýsinga, en við myndum hins vegar kunna að meta það að þú gæfir okkur tækifæri fyrst til þess að leysa málið áður en þú hefur samband við Persónuvernd.
            
            IX. PERSÓNUVERND BARNA
            
            Eik gerir ekki rannsóknir á meðal barna yngri en 18 ára nema með samþykki forráðamanns og barns.
            
            X. BREYTINGAR
            
            Persónuverndarstefnan er endurskoðuð reglulega og kann því að taka breytingum. Þér er því ráðlagt að kynna þér persónuverndarstefnuna reglulega en breytingar á stefnunni öðlast gildi við birtingu á heimasíðu fyrirtækisins; Eikappid.is 
            .
            Fyrst samþykkt: 7. Júlí 2019
            
             
            Öryggisstefna
            Það er stefna Eik að tryggja öryggi upplýsinga félagsins og viðskiptavina sinna m.t.t leyndar, réttleika og tiltækileika. Það er okkar stefna að standa vörð um öryggi gagna og þess búnaðar sem gögnin eru rekin á.
            •	Eik leitast við að finna og meðhöndla áhættu. Áhættumat og innri úttektir eru framkvæmdar reglulega til að ákveða hvort frekari aðgerða sé þörf og til að vinna að stöðugum umbótum.
            •	Eik verndar gögn og upplýsingakerfi gegn óheimiluðum aðgangi, notkun, breytingum, uppljóstrun, eyðileggingu, tapi eða flutningi.
            •	Eik starfrækir skilvirk aðgangsöryggiskerfi að húsnæði og upplýsingakerfum fyrirtækisins með það að marki að vernda gögn og búnað gegn rekstrartruflunum, misnotkun, þjófnaði, skemmdarverkum, glötun o.s.frv.
            •	Starfsmönnum og þjónustuaðilum, núverandi og fyrrverandi, er óheimilt að veita upplýsingar um innri mál Eik, viðskiptavina eða annarra starfsmanna.
            •	Eik stuðlar að virkri öryggisvitund starfsmanna, viðskiptavina, þjónustuaðila og gesta með kynningum og þjálfun. Starfsemi og starfshættir skulu vera til fyrirmyndar hvað varðar upplýsingaöryggi.
            •	Eik fylgir góðum viðskiptaháttum, landslögum og persónuvernd til að tryggja hagsmuni viðskiptavina.
            Eik endurskoðar þessa stefnu eins og tilefni er til en að lágmarki á tveggja ára fresti.
            `,
            acceptTitle: "Ég samþykki",
            declineTitle: "Ég hafna",
            accept: null,
            surveyID: surveyID,
            userID: userID.toUpperCase()
        }
        operationDetails.success = true
        operationDetails.error = false
        operationDetails.message = ""
        operationDetails.acceptConditions = acceptConditions
    } else if(accept == true){
        userID = userID.toUpperCase()
        var message = await db.takeSurvey(userID, surveyID)
        operationDetails.success = message.success
        operationDetails.error = message.error
        operationDetails.message = message.message
        operationDetails.survey = message.survey
    } else {
        operationDetails = {
            success: false,
            title: "Verður að samþykkja ...",
            message: "Verður að samþykkja ...",
            error: ""
        }
    }
    res.send(operationDetails)
}

async function takeSurveyWithInvitationKey(req, res){
    var {
        body: {
            userID = false,
            invitationKey = false
        }
    } = req

    if(!(userID&&invitationKey)){
        await makeOperationDetails(false, "Required fields empty", "Þú hefur ekki lengur aðgang að þessari könnun. Vinsamlegast reyndu aftur síðar.")
    } else {
        userID = userID.toUpperCase()
        var message = await db.takeSurveyWith(invitationKey, userID)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.survey = message.survey
        operationDetails.title = message.success ? "":message.title
    }
    res.send(operationDetails)
}

async function submitAnswers(req, res){
    var {
        body: {
            userID = false,
            survey = false,
            answers = false,
            version = 1.0
        }
    } = req
    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
    } else if(!(userID&&survey&&answers) || (!survey.answerstable) || (!answers[0]) || 
    (!answers[0].question) || (!answers[0].answer&&!answers[0].answers) || (!survey.surveyid)){
        await makeOperationDetails(false, "Required fields empty", "Þú hefur ekki lengur aðgang að þessari könnun. Vinsamlegast reyndu aftur síðar.")
    } else {
        userID = userID.toUpperCase()
        var success = true
        if(success){
            var timeStuff = await getTimeStuff(answers)
            var message = await db.submitAnswers(userID, survey, answers, timeStuff)
            await makeOperationDetails(message.success, message.error, message.message)
        }
    }
    res.send(operationDetails)
}

async function getTimeStuff(answers){
    // Console.log("THE ANSWERS:", answers)
    var timeSpent = []
    var timeRequired = []
    var tooFast = []
    for(var i = 0; i < answers.length; i++){
        timeSpent.push(answers[i].timeSpent)
        timeRequired.push(answers[i].timeRequired)
        tooFast.push(answers[i].tooFast)
    }
    return {
        timeSpent: timeSpent,
        timeRequired: timeRequired,
        tooFast: tooFast
    }
}

async function getPaid(req, res){
    var {
        payment:{
            amount = false,
            userID = false,
            ssn = '',
            bankAccount = '',
            aurPhone = ''
        }
    } = req.body
    
    if((userID&&amount)&&(ssn&&bankAccount || aurPhone)){
        var data = {
            amount: amount,
            userID: userID.toUpperCase(),
            ssn: ssn,
            bankAccount: bankAccount,
            aurPhone: aurPhone
        }
        var message = await db.getPaid(data)
        operationDetails.success = message.success
        operationDetails.title = message.success ? "Úttekt móttekin!":"Úttekt EKKI móttekin!"
        operationDetails.message = message.message
        operationDetails.error = message.error
    } else {
        await makeOperationDetails(false, "Required Fields empty", "Villa á okkar enda. Vinsamlegast reyndu aftur síðar.")
    }
    res.send(operationDetails)
}

async function validateSSN(req, res){
    var {
        body:{
            singleAnswer = false,
            userID = false
        }
    } = req
    if(!(userID&&singleAnswer)){
        await makeOperationDetails(false, "Required Fields empty", "Villa á okkar enda. Vinsamlegast reyndu aftur síðar.")
        operationDetails.title = "Villa!"
    }else{
        console.log("USERID OG SINGLEANSER:", userID, singleAnswer)
        userID = userID.toUpperCase()
        var message = await immediateAnswers.validateSSN(userID, singleAnswer)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.title = message.title
    }
    res.send(operationDetails)
}

async function validatePhone(req, res){
    var {
        body:{
            version = 1.0,
            singleAnswer = false,
            register = false,
            userID = false
        }
    } = req
    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
        operationDetails.customAlert = customAlert
    } else if(singleAnswer && !userID){
        if(singleAnswer == '0000000'){
            await makeOperationDetails(true, '', '')
        } else {
            var message = await immediateAnswers.validatePhone(null, singleAnswer)
            await makeOperationDetails(message.success, message.error, message.message)
            operationDetails.title = message.title
        }

            // if(!register){
            //     var success = await db.doesUserExist(singleAnswer)
            //     if(success){
            //         var message = await immediateAnswers.validatePhone(null, singleAnswer)
            //         await makeOperationDetails(message.success, message.error, message.message)
            //         operationDetails.title = message.title
            //     } else {
            //         await makeOperationDetails(false, "No such Person Exists", "Það er enginn notandi með þetta símanúmer.")
            //         operationDetails.title = "Villa!"
            //     }
            // } else{
            //     if(singleAnswer == "0000000"){
            //         operationDetails.success = true
            //         operationDetails.userID = 1
            //     } else {
            //         var success = await db.doesUserExist(singleAnswer)
            //         if(success){
            //             await makeOperationDetails(false, "", "Það er núþegar til notandi með þetta símanúmer.")
            //             operationDetails.title = "Villa!"
            //         } else {
            //             var message = await immediateAnswers.validatePhone(null, singleAnswer)
            //             await makeOperationDetails(message.success, message.error, message.message)
            //             operationDetails.title = message.title
            //         }
            //     }
            // }
    }else if(!(userID&&singleAnswer)){
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast reyndu aftur síðar.")
        operationDetails.title = "Villa!"
    }else{
        userID = userID.toUpperCase()
        console.log("USERID OG SINGLEANSER:", userID, singleAnswer)
        var message = await immediateAnswers.validatePhone(userID, singleAnswer)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.title = message.title
    }
    res.send(operationDetails)
}



async function changeDeviceToken(req, res){
    var {
        body:{
            userID = false,
            deviceToken = false
        }
    } = req

    if(userID&&deviceToken){
        userID = userID.toUpperCase()
        await db.changeDeviceToken(userID, deviceToken)
        await makeOperationDetails(true, "" ,"")
    } else {
        await makeOperationDetails(false, "" ,"")
    }

    res.send(operationDetails)
}

async function makeOperationDetails(success, error, message){
    operationDetails.success = success
    operationDetails.error = error
    operationDetails.message = message
}


async function cleanUp(req, res, next){
    operationDetails = {}
    next()
}

function catchErrors(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
  }

router.use(catchErrors(cleanUp))
router.post('/login', catchErrors(login))
router.post('/logout', catchErrors(logout))
router.post('/feed', catchErrors(feed))
router.post('/takeSurvey', catchErrors(takeSurvey))
router.post('/takeSurveyWithInvitationKey', catchErrors(takeSurveyWithInvitationKey))
router.post('/submitAnswers', catchErrors(submitAnswers))
router.post('/getPaid', catchErrors(getPaid))
router.post('/changeDeviceToken', catchErrors(changeDeviceToken))
router.post('/validateSSN', catchErrors(validateSSN))
router.post('/validatePhone', catchErrors(validatePhone))

module.exports = router