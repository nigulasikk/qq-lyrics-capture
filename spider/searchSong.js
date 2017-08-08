/**
 *  根据参数，获取专辑歌曲歌词
 */
var albumUrls = [];
var casper = require('casper').create({
    // verbose: true,
    // logLevel: 'debug'
});
var keyWord = casper.cli.args;
var searchUrl = 'https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=album&w=' + keyWord
/**
 * 获取专辑列表链接
 * TODO:写成参数的方式
 * @return {[type]} [description]
 */
function getAlbumLinks(linkClass) {
    var links = document.querySelectorAll('.playlist__list .playlist__item .playlist__title a');
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('href');
    });
}
/**
 * 歌曲儿
 * TODO:写成参数的方式
 * @return {[type]} [description]
 */
function getSongLinks(linkClass) {
    var links = document.querySelectorAll('.songlist__songname_txt a');
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('href');
    });
}
/**
 * 程序开始
 * @param  {[type]} ) 
 * * @return {[type]}   [description]
 */
casper.start(searchUrl, function() {
    this.waitForSelector('.playlist__title', function (){
      albumUrls = this.evaluate(getAlbumLinks);
      this.echo('拿到专辑链接:' + albumUrls)
      /**
       * 遍历每张专辑
       * @param  {[type]} response) 
       * * @return {[type]}           [description]
       */
      this.eachThen(albumUrls, function(response) {
        this.thenOpen(response.data, function() {
            this.echo(this.getTitle());
            this.waitForSelector('.songlist__list', function () {
              var songs = this.evaluate(getSongLinks);
              this.emit("getSongsInfo", songs);
            });
        });
      });
    });
});
/**
 * 从专辑详情 遍历每首歌曲，获取歌曲信息
 * @param  {[type]} songs) 
 * * @return {[type]}        [description]
 */
casper.on("getSongsInfo", function(songs) {
  this.eachThen(songs, function(response) {
    /**
     * 遍历单首歌
     * @param  {[type]} )
     * @param  {[type]} 
     * *@param  {[type]}
     * @return {[type]}          [description]
     */
    this.thenOpen(response.data, function(index) {
        this.waitForSelector('#lrc_content', function () {
           this.echo('获取歌词DOM成功！');
           this.capture('spider/capture/'+new Date()+'.png');
           var title = this.getHTML('.data__name h1');
           var lyric = this.getHTML('#lrc_content');
          
           /**
            * 当DOM已经出现，但歌词还没加载出来的时候
            * @param  {[type]} lyric.length.length [description]
            * @return {[type]}                     [description]
            */
           if (lyric.length === 8) {
              this.waitForSelectorTextChange('#lrc_content', function() {
                  this.echo('歌词插入DOM成功');
                  lyric = this.getHTML('#lrc_content');
                  // this.echo(title);
                  // this.echo(lyric);
                  this.emit("postSong", {name: title, lyrics: lyric});
              });
           } else {
             this.echo('歌词已存在DOM中，直接获取成功');
             // this.echo(title);
             // this.echo(lyric);
             this.emit("postSong", {name: title, lyrics: lyric});
           }
        },function () {
            this.echo('获取歌词DOM超时');
        }, 10000);
    });
  });
});


casper.on('postSong', function (song) {
  this.thenOpen('http://localhost:3000/saveSong', {
      method: "post",
      data: song
  }, function() {
      this.echo("向后台发送post成功")
  });

})


casper.run();