const { test, expect } = require('@playwright/test');
async function move(page,from,to) { await page.locator('[data-square="'+from+'"]').click(); await page.locator('[data-square="'+to+'"]').click(); }
async function solo(page) { await page.getByRole('button',{name:'Play solo',exact:true}).click(); await page.getByRole('button',{name:'New game',exact:true}).click(); }
test('desktop: legal moves, real Stockfish reply, takeback and persistence',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.square')).toHaveCount(64);
  await expect(page.locator('.piece')).toHaveCount(32);
  await expect(page.locator('[data-square="a1"]')).toHaveClass(/dark/);
  await expect(page.locator('[data-square="h1"]')).not.toHaveClass(/dark/);
  await move(page,'e2','e4');
  await expect(page.locator('.move-row').first()).not.toContainText('…',{timeout:20000});
  await expect(page.locator('#turn-badge')).toHaveText('Your turn');
  await page.reload();
  await expect(page.locator('[data-square="e4"]')).toHaveAttribute('data-piece','wp');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.locator('[data-square="e2"]')).toHaveAttribute('data-piece','wp');
  await expect(page.locator('.move-row')).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
});
test('solo play, live level controls, mode confirmation and Black bot opening',async({page})=>{
  await page.goto('/');await solo(page);
  await move(page,'e2','e4');await move(page,'e7','e5');
  await expect(page.locator('#move-history')).toContainText('e5');
  await page.getByRole('button',{name:'Play the bot',exact:true}).click();
  await page.getByRole('button',{name:'Increase difficulty',exact:true}).click();
  await expect(page.locator('#level-value')).toHaveText('4');
  await page.getByRole('button',{name:'Black',exact:true}).click();
  await page.getByRole('button',{name:'New game',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'New game',exact:true}).click();
  await expect(page.locator('#turn-badge')).toHaveText('Your turn',{timeout:20000});
  await expect(page.locator('.square').first()).toHaveAttribute('data-square','h1');
  await expect(page.locator('.move-row')).toHaveCount(1);
});
test('watch: circular safe board, bezel selection, menu and hardware back',async({page})=>{
  await page.setViewportSize({width:360,height:360});await page.goto('/?watch=1');
  await expect(page.locator('html')).toHaveClass('watch');
  const rect=await page.locator('#board').boundingBox();
  for(const x of [rect.x,rect.x+rect.width]) for(const y of [rect.y,rect.y+rect.height]) expect(Math.hypot(x-180,y-180)).toBeLessThan(180);
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('rotarydetent',{detail:{direction:'CW'}})));
  await expect(page.locator('.bezel-focus')).toHaveCount(1);
  await page.locator('#watch-status').click();
  await expect(page.locator('.selected')).toHaveCount(1);
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('tizenhwkey',{detail:{},}))); // no back key: no action
  await page.getByRole('button',{name:'Game settings',exact:true}).click();
  await expect(page.locator('#sidebar')).toHaveClass(/open/);
  await page.screenshot({path:'test-results/watch-settings.png'});
  await page.evaluate(()=>{const e=new Event('tizenhwkey');e.keyName='back';document.dispatchEvent(e);});
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await page.screenshot({path:'test-results/watch-360.png'});
  await page.setViewportSize({width:450,height:450});
  const larger=await page.locator('#board').boundingBox();
  expect(larger.width).toBeCloseTo(306,0);
});
test('watch menu can change mode, adjust difficulty, and start a game through touch',async({page})=>{
  await page.setViewportSize({width:360,height:360});await page.goto('/?watch=1');
  await page.getByRole('button',{name:'Game settings',exact:true}).click();
  await page.getByRole('button',{name:'Increase difficulty',exact:true}).click();
  await expect(page.locator('#level-value')).toHaveText('4');
  await page.getByRole('button',{name:'Play solo',exact:true}).click();
  await page.getByRole('button',{name:'New game',exact:true}).click();
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  await move(page,'e2','e4');await move(page,'e7','e5');
  await expect(page.locator('#watch-status')).toHaveText('White to move');
  await page.getByRole('button',{name:'Game settings',exact:true}).click();
  await page.getByRole('button',{name:'Play the bot',exact:true}).click();
  await page.getByRole('button',{name:'Black',exact:true}).click();
  await page.getByRole('button',{name:'New game',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'New game',exact:true}).click();
  await expect(page.locator('#watch-status')).toHaveText('Black to move',{timeout:20000});
});
test('mobile layout and interactive circular preview stay usable',async({page})=>{
  await page.setViewportSize({width:375,height:812});await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Watch preview',exact:true}).click();
  await expect(page.frameLocator('#watch-preview').locator('.square')).toHaveCount(64);
  await expect(page.frameLocator('#watch-preview').locator('.site-header')).toBeHidden();
  await expect(page.frameLocator('#watch-preview').locator('#watch-status')).toBeVisible();
  await page.screenshot({path:'test-results/watch-preview.png'});
  await page.getByRole('button',{name:'Close preview',exact:true}).click();
  await expect(page.locator('#preview-backdrop')).toBeHidden();
});
test('offline Stockfish is bundled and engine failure offers recovery',async({page,context})=>{
  await page.goto('/');
  await move(page,'d2','d4');
  await expect(page.locator('#turn-badge')).toHaveText('Your turn',{timeout:20000});
  await context.setOffline(true);
  await move(page,'e2','e4');
  await expect(page.locator('#turn-badge')).toHaveText('Your turn',{timeout:20000});
  await context.setOffline(false);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await page.route('**/vendor/stockfish.js',route=>route.abort());
  await move(page,'e2','e4');
  await expect(page.locator('#retry-engine')).toBeVisible();
  await page.unroute('**/vendor/stockfish.js');
  await page.locator('#retry-engine').click();
  await expect(page.locator('#turn-badge')).toHaveText('Your turn',{timeout:20000});
});
test('promotion selection and checkmate are reachable through the UI',async({page})=>{
  await page.goto('/');await solo(page);
  // Legal sequence ending in an a-file pawn promotion, including capture.
  for (const [from,to] of [['a2','a4'],['h7','h5'],['a4','a5'],['h5','h4'],['a5','a6'],['h4','h3'],['a6','b7'],['h3','g2']]) await move(page,from,to);
  await move(page,'b7','a8');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Promote to knight',exact:true}).click();
  await expect(page.locator('[data-square="a8"]')).toHaveAttribute('data-piece','wn');
  await page.getByRole('button',{name:'New game',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'New game',exact:true}).click();
  for (const [from,to] of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']]) await move(page,from,to);
  await expect(page.getByRole('dialog')).toContainText('Checkmate.');
});
