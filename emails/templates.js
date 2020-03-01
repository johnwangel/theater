module.exports = {

    basic: function(text){
      return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <div>
                  <div>
                    <title>StageRabbit</title>
                    <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic|Raleway|Libre+Baskerville&display=swap" rel="stylesheet">
                    <style>
                      h1 {font-family:"Libre Baskerville", sans-serif;font-size:14pt;font-weight:500;color:darkorchid;padding-top:10px;}
                      h2 {font-family:"Libre Baskerville", serif;font-size:12pt;color:#616a70;}
                      h3 {font-family:"Libre Baskerville", sans-serif;font-size:10pt;font-weight:bold;color:#1c1c1c;}
                      p, ul, ol {padding:0;line-height:1.6em;font-family:"Raleway",serif;color:#616a70;font-size:1.3em;}
                      ul, ol {margin:20px;}
                      a {color:darkorchid;text-decoration:none;cursor:pointer;}
                      table tr {background-color:indigo;}
                      table tr table tr {background-color:white;}
                      table tr td div {border:1px solid #edece9; background-color:white;}
                      table table td {width:50%;vertical-align:top;}
                      table table table td {width:75%;vertical-align:middle;}
                      .icon {width:25%;padding-right:5px;}
                      .icon_name {width:75%;padding-left:5px;}
                      .url {word-wrap:break-word;}
                      .heading { font-weight:bold;padding: 15px; background-color: lightgray;color:darkorchid;font-size:1.8em;font-family:'Raleway';}
                      .button-container {
                        display: flex;
                        flex-direction: row;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        border: unset;
                      }
                      .mybutton {
                        padding: 20px;
                        background-color: indigo;
                        color: white;
                        font-size: 2em;
                        font-weight: bold;
                        font-family: 'Raleway';
                        margin: auto;
                        border-radius: 10px;
                        border: 4px solid lightgray;
                        cursor: pointer;
                      }
                    </style>
                    <div>
                      <table style="border-spacing:0;border-collapse:collapse;padding:0;width:600px;margin:0 auto;">
                        <tbody>
                          <tr style="padding:0;">
                            <td>
                              <div style="margin:20px 20px;padding:30px 25px;background-color:indigo;font-family: 'Raleway';">
                                <span style="font-size:2em;color:white;">StageRabbit</span>
                                <span style="color:white;font-size:1.1em;">&nbsp;.&nbsp;.&nbsp;.&nbsp;find great theater near you</span>
                              </div>
                            </td>
                           </tr>
                           <tr>
                            <td>
                              <div style="margin:20px 20px 10px;padding:0 25px 30px;">
                                ${text}
                                <h1>John Atkins, Creator of StageRabbit.com</h1>
                              </div>
                            </td>
                           </tr>
                           <tr style="padding:0;background-color:#000;min-height:45px;width:600px;">
                             <td>
                              <p style="font-family:'Trebuchet MS', sans-serif;font-size:1em;padding:10px;font-weight:lighter;line-height:14px;color:grey;text-align:center;white-space:nowrap;">
                                © StageRabbit, Jersey City, NJ <a rel="nofollow" style="color:grey;text-decoration:underline;" target="_blank" href="https://stagerabbit.com">stagerabbit.com</a>
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                </div>
              </div>`;

  }
}