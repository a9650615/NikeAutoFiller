const puppeteer = require('puppeteer');
const config = require('./fillData');
const [ WIDTH, HEIGHT ] = [ 1400, 900 ];

(async () => {
    const productUrl = config.productUrl
    const browser = await puppeteer.launch({headless: false, devtools: true, args: [
        `--window-size=${ WIDTH + 500 },${ HEIGHT }`,
        `--disk-cache-size=0`,
        `--disable-site-isolation-trials`
    ]});
    const testPage = await browser.newPage();
    await testPage.setViewport({ width: WIDTH, height: HEIGHT })
    testPage.goto('https://www.nike.com/tw/zh_tw/');
	const page = await browser.newPage();
	await page.setViewport({ width: WIDTH, height: HEIGHT })
	await page.goto(productUrl);
	await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'})
  //await page.screenshot({path: 'example.png'});
    await page.click('.addToCartBtn');
	await page.evaluate(orderScript, config)
	await autoFillForm(browser)
	
	// console.log(skuData)
  //await browser.close();
})();

const orderScript = async (config) => {
    window.scrollTo(0, 100);
    const selectedSize = config.selectSize
    // 個人設定
    const allData = JSON.parse($('script[type="application/ld+json"]').text());
    const skuList = []
    // console.log(allData.offers.lowPrice)
    let hasOrdered = false
    let orderedCount = 0
    async function clickForId(forId) {
      return new Promise((resolve, reject) => {
          const values = $(`input[id="${forId}"]`).val() || ''
          const skuId = values.split(':')[1]
          if (selectedSize.indexOf(`${skuId}`) !== -1) {
              orderedCount++;
              hasOrdered = true
              $(`input[id="${forId}"]`).click()
              $('.addToCartBtn').click()
            //   resolve()
              let timer = setInterval(() => {
                  let hasError = $('.ta-sm-c.mr4-sm.ml4-sm.p6-sm.ml0-lg.mr0-lg.mb2-sm').attr('class') !== undefined
                  let success = $('.js-modal.fx-modal.modal').first().hasClass('show')
                  if ( success || hasError) {
                      $('.ncss-container > button').click()
                      if (!hasError) {
                          clearInterval(timer)
                          resolve()
                      } else {
                        $(`input[id="${forId}"]`).click()
                        $('.addToCartBtn').click()
                      }
                  }
              }, 2000);
            //   if (!hasOrdered) {
            //   } else {
            //   }
          }
          else
              resolve()
      })
    }

    async function runAll() {
        for(let forId of skuList) {
            await clickForId(forId)
        }
        console.log('all done')
    }
    //console.log(skuList)
    $('.availableSizeContainer[name="skuAndSize"] label').each((i, ele) => {
        const forId = $(ele).attr('for')
        //console.log(values)
        //const values = $(`input[id="${forId}"]`).val() || ''
        //const skuId = values.split(':')[1]
        skuList.push(forId)
    })

    console.log(skuList)

    await runAll()
    //if (orderCount > 0)
    // setTimeout(() => {
    //     location.href="https://secure-store.nike.com/TW/checkout/html/index.jsp?l=checkout&country=TW&lang_locale=zh_tw&site=nikestore"
    // }, 500)
}

const autoFillForm = async (browser) => {
    const formData = config.info
    const buyCartPage = await browser.newPage()
    await buyCartPage.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'})
    await buyCartPage.setViewport({ width: WIDTH, height: HEIGHT })
    await buyCartPage.goto("https://secure-store.nike.com/TW/checkout/html/index.jsp?l=checkout&country=TW&lang_locale=zh_tw&site=nikestore", { waitUntil: 'networkidle2' })
    // await buyCartPage.waitForNavigation({'waitUntil': 'networkidle0'});
    await buyCartPage.waitForSelector('.order-content');
    // await buyCartPage.waitFor(200)
    await buyCartPage.type('#Shipping_LastName', formData.lastName);
    await buyCartPage.type('#Shipping_FirstName', formData.lastName);
    await buyCartPage.type('#Shipping_PostCode', formData.postCode);
    await buyCartPage.select('#Shipping_Territory', formData.country)
    await buyCartPage.type('#Shipping_Address3', formData.town);
    await buyCartPage.type('#Shipping_Address1', formData.address);
    await buyCartPage.type('#Shipping_phonenumber', formData.phone);
    await buyCartPage.type('#governmentid', formData.govermentId);
    await buyCartPage.type('#shipping_Email', formData.email);
    await buyCartPage.waitForSelector('.checkbox-checkmark',{visible:true,timeout:45000});
    await buyCartPage.click('#gdprSection .checkbox-checkmark')
    await buyCartPage.waitForSelector('#shippingSubmit');
    await buyCartPage.click('#shippingSubmit')
    await buyCartPage.waitFor(200)
    await buyCartPage.click('#billingSubmit')
    await buyCartPage.waitFor(20000)
    // await buyCartPage.waitForSelector('#CreditCardHolder');
    // fill credit card
    console.log('fill it')
    // await buyCartPage.evaluate((formData) => {
    //     const iframe = $('#paymentIFrame')
    //     const timerInput = setInterval(() => {
    //         console.log("waiting")
    //         // if (typeof SSLForm != "undefined") {
    //         //     console.log(SSLForm)
    //         //     clearInterval(timerInput)
    //         // }
    //         if ($('#CreditCardInfo', iframe.contents()).length > 0) {
    //             clearInterval(timerInput)
    //             $('#CreditCardInfo #CreditCardHolder', iframe.contents()).val(formData.creditName)
    //             $('#CreditCardInfo #KKnr', iframe.contents()).val(formData.creditNumber)
    //             $('#CreditCardInfo #KKMonth', iframe.contents()).val(formData.creditMonth)
    //             $('#CreditCardInfo #KKYear', iframe.contents()).val(formData.creditYear)
    //             $('#CreditCardInfo #CCCVC', iframe.contents()).val(formData.CCCVC)
    //             console.log('filled')
    //         }
    //     }, 500)
    //     console.log(formData)
    // }, formData)
    //const iFrameLoaded = waitForIFrameLoad(buyCartPage, '#paymentIFrame')
    //await iFrameLoaded;
    await buyCartPage.waitForSelector('#paymentIFrame',{visible:true,timeout:45000});
    /*const myFrame = await buyCartPage.$('#paymentIFrame')
    const mainFrame = myFrame._mainFrame
    console.log(mainFrame.name())
    console.log(await myFrame.$('#CreditCardHolder'))
    console.log(await mainFrame.$('#CreditCardHolder'))
    */
   var frames = await buyCartPage.frames();
    var myframe = frames.find(
        f =>
            f.url().indexOf("paygate") > 0);
    //await myframe.waitForSelector('#CreditCardHolder');
    const creditNumber = await myframe.$("#CreditCardHolder");
    await creditNumber.type(formData.creditName);
    const kknr = await myframe.$("#KKnr");
    await kknr.type(formData.creditNumber);
    const cccvc = await myframe.$("#CCCVC");
    await cccvc.type(formData.CCCVC);
    const kkMonth = await myframe.$("#KKMonth");
    await kkMonth.type(formData.creditMonth);
    const kkYear = await myframe.$("#KKYear");
    await kkYear.type(formData.creditYear);
    await myframe.click('#BtnPurchase')
    // const frames = await buyCartPage.frames();
    // console.log(frames)
    // await buyCartPage.type('input#CreditCardHolder', formData.creditName);
    // await buyCartPage.type('#KKnr', formData.creditNumber);
    // await buyCartPage.select('#KKMonth', formData.creditMonth);
    // await buyCartPage.select('#KKYear', formData.creditYear);
    // await buyCartPage.type('#CCCVC', formData.CCCVC);
    //  await buyCartPage.click('#BtnPurchase')
}

function waitForIFrameLoad(page, iframeSelector, timeout = 10000) {
    // if pageFunction returns a promise, $eval will wait for its resolution
   return this.page.$eval(
     iFrameSelector,
     (el, timeout) => {
       const p = new Promise((resolve, reject) => {
         el.onload = () => {
           resolve()
         }
         setTimeout(() => {
           reject(new Error("Waiting for iframe load has timed out"))
         }, timeout)
       })
       return p
     },
     timeout,
   )
}