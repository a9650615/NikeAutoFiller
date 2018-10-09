const puppeteer = require('puppeteer');
const [ WIDTH, HEIGHT ] = [ 1400, 900 ];

(async () => {
    const productUrl = 'https://www.nike.com/tw/t/hyperdunk-10-%E7%B1%83%E7%90%83-Vhj1Vz/AO7893-002'
    const browser = await puppeteer.launch({headless: false, devtools: true, args: [
        `--window-size=${ WIDTH + 500 },${ HEIGHT }`,
        `--disk-cache-size=0`
    ]});
	const page = await browser.newPage();
	await page.setViewport({ width: WIDTH, height: HEIGHT })
	await page.goto(productUrl);
	await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'})
  //await page.screenshot({path: 'example.png'});
    await page.click('.addToCartBtn');
	await page.evaluate(orderScript)
	await autoFillForm(browser)
	
	// console.log(skuData)
  //await browser.close();
})();

const orderScript = async () => {
    window.scrollTo(0, 100);
	const selectedSize = ['8']
    const qty = [1]
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
    const formData = {
        lastName: 'lastName',
        firstName: 'firstName',
        postCode: '103',
        country: '臺北市',
        town: '新北',
        address: '我家',
        phone: '09999999',
        govermentId: 'N126666666',
        email: 'a9999@gmail.com'
    }
    const buyCartPage = await browser.newPage()
    await buyCartPage.setViewport({ width: WIDTH, height: HEIGHT })
    buyCartPage.goto("https://secure-store.nike.com/TW/checkout/html/index.jsp?l=checkout&country=TW&lang_locale=zh_tw&site=nikestore")
    await buyCartPage.type('#Shipping_LastName', formData.lastName);
    await buyCartPage.type('#Shipping_FirstName', formData.lastName);
    await buyCartPage.type('#Shipping_PostCode', formData.postCode);
    await buyCartPage.select('#telCountryInput', formData.country)
    await buyCartPage.type('#Shipping_Address3', formData.town);
    await buyCartPage.type('#Shipping_Address1', formData.address);
    await buyCartPage.type('#Shipping_phonenumber', formData.phone);
    await buyCartPage.type('#governmentid', formData.govermentId);
    await buyCartPage.type('#shipping_Email', formData.email);
    await buyCartPage.click('.checkbox-checkmark')
    await buyCartPage.click('#shippingSubmit')
}