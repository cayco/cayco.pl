<?php /* Smarty version 3.1.27, created on 2015-10-04 18:24:25
         compiled from "templates/index.tpl" */ ?>
<?php
/*%%SmartyHeaderCode:1201789088561152b914a0a6_98167791%%*/
if(!defined('SMARTY_DIR')) exit('no direct access allowed');
$_valid = $_smarty_tpl->decodeProperties(array (
  'file_dependency' => 
  array (
    '90093ad09988b466f409a1871733c5589014713e' => 
    array (
      0 => 'templates/index.tpl',
      1 => 1443975864,
      2 => 'file',
    ),
  ),
  'nocache_hash' => '1201789088561152b914a0a6_98167791',
  'variables' => 
  array (
    'name' => 0,
  ),
  'has_nocache_code' => false,
  'version' => '3.1.27',
  'unifunc' => 'content_561152b9180cf8_77040449',
),false);
/*/%%SmartyHeaderCode%%*/
if ($_valid && !is_callable('content_561152b9180cf8_77040449')) {
function content_561152b9180cf8_77040449 ($_smarty_tpl) {

$_smarty_tpl->properties['nocache_hash'] = '1201789088561152b914a0a6_98167791';
?>
<html>
  <head>
    <title>Smarty</title>
  </head>
  <body>
    <h1>Hello, <?php echo $_smarty_tpl->tpl_vars['name']->value;?>
!</h1>
  </body>
</html><?php }
}
?>