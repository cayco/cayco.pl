<?php
//ini_set('display_errors', true);
//error_reporting(E_ALL + E_NOTICE);

require "libs/Smarty.class.php";
$smarty = new Smarty();

$smarty->setTemplateDir("templates");
$smarty->setCompileDir("templates_c");
$smarty->setCacheDir("cache");
$smarty->setConfigDir("configs");

$smarty->display("hobby.tpl");
?>